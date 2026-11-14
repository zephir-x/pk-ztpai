const { createReservationsService } = require("../../src/modules/reservations/reservations.service");
const { createInMemoryRepositories } = require("../../src/modules/unitOfWork.memory");

const owner = { id: 1, role: "USER" };
const otherUser = { id: 2, role: "USER" };
const admin = { id: 99, role: "ADMIN" };
const NOW = new Date("2026-11-15T10:00:00.000Z");

// Helper creating an isolated service instance with fresh in-memory state, spy eventBus, and frozen clock per test
function setup({ rooms, reservations = [] } = {}) {
    const { runInTransaction } = createInMemoryRepositories({
        rooms: rooms ?? [
            { id: 1, name: "A101", capacity: 10 },
            { id: 2, name: "B202", capacity: 20 }
        ],
        reservations
    });

    const eventBus = {
        publish: jest.fn(),
        subscribe: jest.fn()
    };

    const service = createReservationsService({
        runInTransaction,
        eventBus,
        now: () => NOW
    });

    return { service, eventBus };
}

const existingReservation = ({
    id = 1,
    roomId = 1,
    userId = owner.id,
    participants = 5,
    startTime = "2026-11-16T10:00:00.000Z",
    endTime = "2026-11-16T12:00:00.000Z",
    status = "CONFIRMED",
    cancelledAt = null
} = {}) => ({
    id,
    roomId,
    userId,
    user: { id: userId, email: `user${userId}@example.com` },
    participants,
    startTime,
    endTime,
    status,
    createdAt: NOW.toISOString(),
    cancelledAt
});

describe("reservationsService.createReservation", () => {
    describe("overlapping rules", () => {
        test("rejects partial overlap with existing CONFIRMED reservation", async () => {
            const { service } = setup({
                reservations: [existingReservation({ startTime: "2026-11-16T10:00:00.000Z", endTime: "2026-11-16T12:00:00.000Z" })]
            });

            await expect(
                service.createReservation({
                    roomId: 1,
                    participants: 5,
                    startTime: "2026-11-16T11:00:00.000Z",
                    endTime: "2026-11-16T13:00:00.000Z"
                }, owner)
            ).rejects.toMatchObject({ statusCode: 409, code: "ROOM_ALREADY_BOOKED" });
        });

        test("rejects reservation completely contained within an existing reservation", async () => {
            const { service } = setup({
                reservations: [existingReservation({ startTime: "2026-11-16T10:00:00.000Z", endTime: "2026-11-16T14:00:00.000Z" })]
            });

            await expect(
                service.createReservation({
                    roomId: 1,
                    participants: 5,
                    startTime: "2026-11-16T11:00:00.000Z",
                    endTime: "2026-11-16T12:00:00.000Z"
                }, owner)
            ).rejects.toMatchObject({ statusCode: 409, code: "ROOM_ALREADY_BOOKED" });
        });

        test("allows adjacent time intervals (new starts exactly when existing ends)", async () => {
            const { service } = setup({
                reservations: [existingReservation({ startTime: "2026-11-16T10:00:00.000Z", endTime: "2026-11-16T12:00:00.000Z" })]
            });

            await expect(
                service.createReservation({
                    roomId: 1,
                    participants: 5,
                    startTime: "2026-11-16T12:00:00.000Z",
                    endTime: "2026-11-16T13:00:00.000Z"
                }, owner)
            ).resolves.toMatchObject({
                roomId: 1,
                status: "CONFIRMED",
                startTime: "2026-11-16T12:00:00.000Z",
                endTime: "2026-11-16T13:00:00.000Z"
            });
        });

        test("allows identical time interval in a different room", async () => {
            const { service } = setup({
                reservations: [existingReservation({ roomId: 1, startTime: "2026-11-16T10:00:00.000Z", endTime: "2026-11-16T12:00:00.000Z" })]
            });

            await expect(
                service.createReservation({
                    roomId: 2,
                    participants: 5,
                    startTime: "2026-11-16T10:00:00.000Z",
                    endTime: "2026-11-16T12:00:00.000Z"
                }, owner)
            ).resolves.toMatchObject({
                roomId: 2,
                status: "CONFIRMED"
            });
        });

        test("allows booking over a CANCELLED reservation in the same room and time slot", async () => {
            const { service } = setup({
                reservations: [
                    existingReservation({
                        roomId: 1,
                        startTime: "2026-11-16T10:00:00.000Z",
                        endTime: "2026-11-16T12:00:00.000Z",
                        status: "CANCELLED",
                        cancelledAt: "2026-11-15T09:00:00.000Z"
                    })
                ]
            });

            await expect(
                service.createReservation({
                    roomId: 1,
                    participants: 5,
                    startTime: "2026-11-16T10:00:00.000Z",
                    endTime: "2026-11-16T12:00:00.000Z"
                }, owner)
            ).resolves.toMatchObject({
                roomId: 1,
                status: "CONFIRMED"
            });
        });
    });

    describe("room capacity boundary rules", () => {
        test("allows reservation when participants equal room capacity", async () => {
            const { service } = setup();

            await expect(
                service.createReservation({
                    roomId: 1,
                    participants: 10,
                    startTime: "2026-11-16T10:00:00.000Z",
                    endTime: "2026-11-16T11:00:00.000Z"
                }, owner)
            ).resolves.toMatchObject({
                participants: 10,
                status: "CONFIRMED"
            });
        });

        test("rejects reservation when participants exceed room capacity by 1", async () => {
            const { service } = setup();

            await expect(
                service.createReservation({
                    roomId: 1,
                    participants: 11,
                    startTime: "2026-11-16T10:00:00.000Z",
                    endTime: "2026-11-16T11:00:00.000Z"
                }, owner)
            ).rejects.toMatchObject({ statusCode: 409, code: "ROOM_CAPACITY_EXCEEDED" });
        });
    });

    describe("duration boundary rules", () => {
        test.each([
            ["exactly 15 minutes", "2026-11-16T10:00:00.000Z", "2026-11-16T10:15:00.000Z"],
            ["exactly 8 hours", "2026-11-16T10:00:00.000Z", "2026-11-16T18:00:00.000Z"]
        ])("allows valid boundary duration: %s", async (_label, startTime, endTime) => {
            const { service } = setup();

            await expect(
                service.createReservation({
                    roomId: 1,
                    participants: 5,
                    startTime,
                    endTime
                }, owner)
            ).resolves.toMatchObject({ status: "CONFIRMED" });
        });

        test.each([
            ["14 minutes (below minimum)", "2026-11-16T10:00:00.000Z", "2026-11-16T10:14:00.000Z"],
            ["8 hours and 1 minute (above maximum)", "2026-11-16T10:00:00.000Z", "2026-11-16T18:01:00.000Z"]
        ])("rejects invalid boundary duration: %s", async (_label, startTime, endTime) => {
            const { service } = setup();

            await expect(
                service.createReservation({
                    roomId: 1,
                    participants: 5,
                    startTime,
                    endTime
                }, owner)
            ).rejects.toMatchObject({ statusCode: 400, code: "VALIDATION_ERROR" });
        });
    });

    describe("domain events publishing", () => {
        test("publishes reservation.created after successful booking and does not publish on failure", async () => {
            const { service, eventBus } = setup({
                reservations: [existingReservation({ startTime: "2026-11-16T10:00:00.000Z", endTime: "2026-11-16T12:00:00.000Z" })]
            });

            // 1. Failing operation (409 overlap) must NOT publish any event
            await expect(
                service.createReservation({
                    roomId: 1,
                    participants: 5,
                    startTime: "2026-11-16T11:00:00.000Z",
                    endTime: "2026-11-16T13:00:00.000Z"
                }, owner)
            ).rejects.toMatchObject({ statusCode: 409, code: "ROOM_ALREADY_BOOKED" });

            expect(eventBus.publish).not.toHaveBeenCalled();

            // 2. Successful operation must publish reservation.created with exact payload contract
            const created = await service.createReservation({
                roomId: 1,
                participants: 5,
                startTime: "2026-11-16T14:00:00.000Z",
                endTime: "2026-11-16T16:00:00.000Z"
            }, owner);

            expect(eventBus.publish).toHaveBeenCalledTimes(1);
            expect(eventBus.publish).toHaveBeenCalledWith("reservation.created", {
                reservationId: created.id,
                roomId: 1,
                userId: owner.id,
                startTime: "2026-11-16T14:00:00.000Z",
                endTime: "2026-11-16T16:00:00.000Z"
            });
        });
    });
});

describe("reservationsService.cancelReservation", () => {
    test("rejects cancelling a reservation that has already started", async () => {
        const { service } = setup({
            reservations: [
                existingReservation({
                    id: 1,
                    userId: owner.id,
                    startTime: "2026-11-15T09:00:00.000Z",
                    endTime: "2026-11-15T11:00:00.000Z"
                })
            ]
        });

        await expect(service.cancelReservation(1, owner))
            .rejects.toMatchObject({ statusCode: 409, code: "RESERVATION_ALREADY_STARTED" });
    });

    test("handles double cancellation idempotently without modifying cancelledAt or re-publishing event", async () => {
        const originalCancelledAt = "2026-11-14T15:30:00.000Z";
        const { service, eventBus } = setup({
            reservations: [
                existingReservation({
                    id: 1,
                    userId: owner.id,
                    startTime: "2026-11-16T10:00:00.000Z",
                    endTime: "2026-11-16T12:00:00.000Z",
                    status: "CANCELLED",
                    cancelledAt: originalCancelledAt
                })
            ]
        });

        const result = await service.cancelReservation(1, owner);

        expect(result).toMatchObject({
            id: 1,
            status: "CANCELLED",
            cancelledAt: originalCancelledAt
        });
        expect(eventBus.publish).not.toHaveBeenCalled();
    });

    test("rejects cancellation by another USER with 404 NOT_FOUND and allows ADMIN (publishing reservation.cancelled)", async () => {
        const { service, eventBus } = setup({
            reservations: [
                existingReservation({
                    id: 1,
                    roomId: 1,
                    userId: owner.id,
                    startTime: "2026-11-16T10:00:00.000Z",
                    endTime: "2026-11-16T12:00:00.000Z"
                })
            ]
        });

        await expect(service.cancelReservation(1, otherUser))
            .rejects.toMatchObject({ statusCode: 404, code: "NOT_FOUND" });
        expect(eventBus.publish).not.toHaveBeenCalled();

        await expect(service.cancelReservation(1, admin))
            .resolves.toMatchObject({
                id: 1,
                status: "CANCELLED",
                cancelledAt: NOW.toISOString()
            });

        expect(eventBus.publish).toHaveBeenCalledTimes(1);
        expect(eventBus.publish).toHaveBeenCalledWith("reservation.cancelled", {
            reservationId: 1,
            roomId: 1,
            userId: owner.id,
            cancelledBy: admin.id
        });
    });
});

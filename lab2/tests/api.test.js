const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { createApp } = require("../src/app");
const { createInMemoryRoomsRepository } = require("../src/modules/rooms/rooms.repository.memory");
const { createInMemoryReservationsRepository } = require("../src/modules/reservations/reservations.repository.memory");
const { ALLOWED_TRANSITIONS } = require("../src/modules/reservations/reservations.service");

describe("Room Booking API - Lab 2 Test Suite", () => {
    let server;
    let baseUrl;
    let currentNow;
    let roomsRepository;
    let reservationsRepository;

    beforeEach(async () => {
        currentNow = new Date("2026-10-20T08:15:00.000Z");
        roomsRepository = createInMemoryRoomsRepository();
        reservationsRepository = createInMemoryReservationsRepository();

        const app = createApp({
            roomsRepository,
            reservationsRepository,
            now: () => currentNow
        });

        await new Promise(resolve => {
            server = app.listen(0, () => {
                const { port } = server.address();
                baseUrl = `http://127.0.0.1:${port}`;
                resolve();
            });
        });
    });

    afterEach(async () => {
        if (server) {
            await new Promise(resolve => server.close(resolve));
        }
    });

    describe("Task 1: Layered Architecture & Basic Endpoints", () => {
        it("GET /api/rooms returns all seeded rooms as DTOs", async () => {
            const res = await fetch(`${baseUrl}/api/rooms`);
            const body = await res.json();

            assert.equal(res.status, 200);
            assert.equal(body.length, 4);
            assert.deepEqual(body[0], { id: 1, name: "A101", capacity: 30 });
        });

        it("GET /api/rooms/:id returns a specific room or 404 when not found", async () => {
            const okRes = await fetch(`${baseUrl}/api/rooms/2`);
            const okBody = await okRes.json();
            assert.equal(okRes.status, 200);
            assert.deepEqual(okBody, { id: 2, name: "B202", capacity: 15 });

            const notFoundRes = await fetch(`${baseUrl}/api/rooms/999`);
            const notFoundBody = await notFoundRes.json();
            assert.equal(notFoundRes.status, 404);
            assert.equal(notFoundBody.error.code, "NOT_FOUND");
            assert.equal(notFoundBody.error.message, "Room not found");
        });

        it("GET /api/reservations lists all reservations and filters by roomId", async () => {
            const allRes = await fetch(`${baseUrl}/api/reservations`);
            const allBody = await allRes.json();
            assert.equal(allRes.status, 200);
            assert.equal(allBody.length, 1);

            const room1Res = await fetch(`${baseUrl}/api/reservations?roomId=1`);
            const room1Body = await room1Res.json();
            assert.equal(room1Res.status, 200);
            assert.equal(room1Body.length, 1);

            const room999Res = await fetch(`${baseUrl}/api/reservations?roomId=999`);
            const room999Body = await room999Res.json();
            assert.equal(room999Res.status, 200);
            assert.deepEqual(room999Body, []);
        });

        it("Repository methods return Promises and generate incrementing IDs", async () => {
            const r1 = await reservationsRepository.create({
                roomId: 1,
                reservedBy: "User One",
                participants: 5,
                startTime: "2026-11-10T10:00:00.000Z",
                endTime: "2026-11-10T11:00:00.000Z"
            });
            const r2 = await reservationsRepository.create({
                roomId: 1,
                reservedBy: "User Two",
                participants: 5,
                startTime: "2026-11-10T12:00:00.000Z",
                endTime: "2026-11-10T13:00:00.000Z"
            });

            assert.equal(r1.id, 2);
            assert.equal(r2.id, 3);
        });
    });

    describe("Task 2: Validation with Zod", () => {
        it("POST /api/reservations returns 400 with all validation issues at once (including strict unknown keys)", async () => {
            const res = await fetch(`${baseUrl}/api/reservations`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    roomId: "1",
                    reservedBy: "  ab  ",
                    participants: -5,
                    startTime: "2026-11-10T10:00:00.000Z",
                    endTime: "invalid-date",
                    status: "CONFIRMED",
                    isAdmin: true
                })
            });

            const body = await res.json();
            assert.equal(res.status, 400);
            assert.equal(body.error.code, "VALIDATION_ERROR");
            assert.equal(body.error.message, "Validation failed");
            assert.ok(Array.isArray(body.error.details));
            assert.ok(body.error.details.length >= 4);

            const fields = body.error.details.map(d => d.field);
            assert.ok(fields.includes("roomId"));
            assert.ok(fields.includes("reservedBy"));
            assert.ok(fields.includes("participants"));
            assert.ok(fields.includes("endTime"));
            assert.ok(body.error.details.some(d => d.message.includes("Unrecognized key")));
        });

        it("Validates :id in URL as positive integer (returns 400 instead of 404)", async () => {
            const resRoom = await fetch(`${baseUrl}/api/rooms/abc`);
            const bodyRoom = await resRoom.json();
            assert.equal(resRoom.status, 400);
            assert.equal(bodyRoom.error.code, "VALIDATION_ERROR");
            assert.equal(bodyRoom.error.details[0].location, "params");
            assert.equal(bodyRoom.error.details[0].field, "id");

            const resCancel = await fetch(`${baseUrl}/api/reservations/0/cancel`, {
                method: "PATCH"
            });
            assert.equal(resCancel.status, 400);
        });

        it("Validates roomId in query as positive integer", async () => {
            const res = await fetch(`${baseUrl}/api/reservations?roomId=abc`);
            const body = await res.json();
            assert.equal(res.status, 400);
            assert.equal(body.error.code, "VALIDATION_ERROR");
            assert.equal(body.error.details[0].location, "query");
            assert.equal(body.error.details[0].field, "roomId");
        });

        it("Trims reservedBy and converts timezone offsets to UTC ISO string", async () => {
            const res = await fetch(`${baseUrl}/api/reservations`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    roomId: 1,
                    reservedBy: "   Jan Kowalski   ",
                    participants: 15,
                    startTime: "2026-11-10T11:00:00+01:00",
                    endTime: "2026-11-10T13:00:00+01:00"
                })
            });

            const body = await res.json();
            assert.equal(res.status, 201);
            assert.equal(body.reservedBy, "Jan Kowalski");
            assert.equal(body.startTime, "2026-11-10T10:00:00.000Z");
            assert.equal(body.endTime, "2026-11-10T12:00:00.000Z");
        });
    });

    describe("Task 3: Global Error Handling & Logging", () => {
        it("Returns 404 JSON for unknown routes instead of default Express HTML", async () => {
            const res = await fetch(`${baseUrl}/api/nope`);
            const body = await res.json();

            assert.equal(res.status, 404);
            assert.equal(body.error.code, "NOT_FOUND");
            assert.match(body.error.message, /Route GET \/api\/nope not found/);
            assert.ok(body.error.requestId);
        });

        it("Returns 400 INVALID_JSON when request body contains malformed JSON", async () => {
            const res = await fetch(`${baseUrl}/api/reservations`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: "{\"roomId\": 1,"
            });
            const body = await res.json();

            assert.equal(res.status, 400);
            assert.equal(body.error.code, "INVALID_JSON");
            assert.ok(body.error.requestId);

            const strictRes = await fetch(`${baseUrl}/api/reservations`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: "\"malformed-json-body\""
            });
            const strictBody = await strictRes.json();

            assert.equal(strictRes.status, 400);
            assert.equal(strictBody.error.code, "INVALID_JSON");
        });

        it("Propagates custom X-Request-Id header to response header and error payload", async () => {
            const customId = "test-req-id-12345";
            const res = await fetch(`${baseUrl}/api/rooms/999`, {
                headers: { "X-Request-Id": customId }
            });
            const body = await res.json();

            assert.equal(res.status, 404);
            assert.equal(res.headers.get("x-request-id"), customId);
            assert.equal(body.error.requestId, customId);
        });

        it("Returns 500 INTERNAL_ERROR on unexpected crash without leaking stack trace", async () => {
            const res = await fetch(`${baseUrl}/api/debug/crash`, {
                headers: { "X-Request-Id": "crash-test-id" }
            });
            const body = await res.json();

            assert.equal(res.status, 500);
            assert.deepEqual(body, {
                error: {
                    code: "INTERNAL_ERROR",
                    message: "Unexpected error",
                    requestId: "crash-test-id"
                }
            });
            assert.equal(body.error.stack, undefined);
        });
    });

    describe("Task 4: Business Rules - Time Constraints, Capacity & Overlapping Reservations", () => {
        it("Rejects reservation when startTime is in the past (400)", async () => {
            const res = await fetch(`${baseUrl}/api/reservations`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    roomId: 1,
                    reservedBy: "Jan Kowalski",
                    participants: 10,
                    startTime: "2026-10-20T07:00:00.000Z",
                    endTime: "2026-10-20T09:00:00.000Z"
                })
            });
            assert.equal(res.status, 400);
        });

        it("Rejects reservation when endTime is not after startTime (400)", async () => {
            const res = await fetch(`${baseUrl}/api/reservations`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    roomId: 1,
                    reservedBy: "Jan Kowalski",
                    participants: 10,
                    startTime: "2026-11-10T12:00:00.000Z",
                    endTime: "2026-11-10T10:00:00.000Z"
                })
            });
            assert.equal(res.status, 400);
        });

        it("Enforces duration between 15 minutes and 8 hours (400)", async () => {
            // 10 minutes -> 400
            const tooShortRes = await fetch(`${baseUrl}/api/reservations`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    roomId: 1,
                    reservedBy: "Jan Kowalski",
                    participants: 10,
                    startTime: "2026-11-10T10:00:00.000Z",
                    endTime: "2026-11-10T10:10:00.000Z"
                })
            });
            assert.equal(tooShortRes.status, 400);

            // 9 hours -> 400
            const tooLongRes = await fetch(`${baseUrl}/api/reservations`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    roomId: 1,
                    reservedBy: "Jan Kowalski",
                    participants: 10,
                    startTime: "2026-11-10T08:00:00.000Z",
                    endTime: "2026-11-10T17:00:00.000Z"
                })
            });
            assert.equal(tooLongRes.status, 400);
        });

        it("Enforces room existence (404) and room capacity (409)", async () => {
            const missingRoomRes = await fetch(`${baseUrl}/api/reservations`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    roomId: 999,
                    reservedBy: "Jan Kowalski",
                    participants: 10,
                    startTime: "2026-11-10T10:00:00.000Z",
                    endTime: "2026-11-10T12:00:00.000Z"
                })
            });
            assert.equal(missingRoomRes.status, 404);

            const overCapacityRes = await fetch(`${baseUrl}/api/reservations`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    roomId: 1,
                    reservedBy: "Jan Kowalski",
                    participants: 31,
                    startTime: "2026-11-10T10:00:00.000Z",
                    endTime: "2026-11-10T12:00:00.000Z"
                })
            });
            const overCapacityBody = await overCapacityRes.json();
            assert.equal(overCapacityRes.status, 409);
            assert.equal(overCapacityBody.error.code, "ROOM_CAPACITY_EXCEEDED");
        });

        it("Correctly handles all 7 interval overlap scenarios from Task 4 table", async () => {
            const createBooking = (payload) =>
                fetch(`${baseUrl}/api/reservations`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

            // Base reservation: 10:00-12:00 in Room 1
            const baseRes = await createBooking({
                roomId: 1,
                reservedBy: "Jan Kowalski",
                participants: 20,
                startTime: "2026-11-10T10:00:00.000Z",
                endTime: "2026-11-10T12:00:00.000Z"
            });
            const baseBooking = await baseRes.json();
            assert.equal(baseRes.status, 201);

            // 1. 12:00-13:00 -> OK (touches end, does not overlap)
            const case1 = await createBooking({
                roomId: 1,
                reservedBy: "Anna Nowak",
                participants: 10,
                startTime: "2026-11-10T12:00:00.000Z",
                endTime: "2026-11-10T13:00:00.000Z"
            });
            assert.equal(case1.status, 201);

            // 2. 08:00-10:00 -> OK (touches start, does not overlap)
            const case2 = await createBooking({
                roomId: 1,
                reservedBy: "Anna Nowak",
                participants: 10,
                startTime: "2026-11-10T08:00:00.000Z",
                endTime: "2026-11-10T10:00:00.000Z"
            });
            assert.equal(case2.status, 201);

            // 3. 11:00-13:00 -> 409 ROOM_ALREADY_BOOKED (overlaps 11:00-12:00)
            const case3 = await createBooking({
                roomId: 1,
                reservedBy: "Piotr Wiśniewski",
                participants: 10,
                startTime: "2026-11-10T11:00:00.000Z",
                endTime: "2026-11-10T13:00:00.000Z"
            });
            const case3Body = await case3.json();
            assert.equal(case3.status, 409);
            assert.equal(case3Body.error.code, "ROOM_ALREADY_BOOKED");

            // 4. 09:00-13:00 -> 409 ROOM_ALREADY_BOOKED (contains existing reservation)
            const case4 = await createBooking({
                roomId: 1,
                reservedBy: "Piotr Wiśniewski",
                participants: 10,
                startTime: "2026-11-10T09:00:00.000Z",
                endTime: "2026-11-10T13:00:00.000Z"
            });
            const case4Body = await case4.json();
            assert.equal(case4.status, 409);
            assert.equal(case4Body.error.code, "ROOM_ALREADY_BOOKED");

            // 5. 10:30-11:00 -> 409 ROOM_ALREADY_BOOKED (contained within existing reservation)
            const case5 = await createBooking({
                roomId: 1,
                reservedBy: "Piotr Wiśniewski",
                participants: 10,
                startTime: "2026-11-10T10:30:00.000Z",
                endTime: "2026-11-10T11:00:00.000Z"
            });
            const case5Body = await case5.json();
            assert.equal(case5.status, 409);
            assert.equal(case5Body.error.code, "ROOM_ALREADY_BOOKED");

            // 6. 10:00-12:00 in another room (Room 2) -> OK
            const case6 = await createBooking({
                roomId: 2,
                reservedBy: "Katarzyna Lewandowska",
                participants: 10,
                startTime: "2026-11-10T10:00:00.000Z",
                endTime: "2026-11-10T12:00:00.000Z"
            });
            assert.equal(case6.status, 201);

            // 7. 10:00-12:00 in Room 1 when existing reservation is CANCELLED -> OK
            const cancelRes = await fetch(`${baseUrl}/api/reservations/${baseBooking.id}/cancel`, {
                method: "PATCH"
            });
            assert.equal(cancelRes.status, 200);

            const case7 = await createBooking({
                roomId: 1,
                reservedBy: "Michał Zieliński",
                participants: 15,
                startTime: "2026-11-10T10:00:00.000Z",
                endTime: "2026-11-10T12:00:00.000Z"
            });
            assert.equal(case7.status, 201);
        });
    });

    describe("Task 5: Cancellation State Machine & Response DTO", () => {
        it("Sets Location header and hides internalNote in reservation DTO responses", async () => {
            const createRes = await fetch(`${baseUrl}/api/reservations`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    roomId: 1,
                    reservedBy: "Jan Kowalski",
                    participants: 20,
                    startTime: "2026-11-10T10:00:00.000Z",
                    endTime: "2026-11-10T12:00:00.000Z"
                })
            });
            const createdDto = await createRes.json();

            assert.equal(createRes.status, 201);
            assert.equal(createRes.headers.get("location"), `/api/reservations/${createdDto.id}`);
            assert.equal(createdDto.internalNote, undefined);
            assert.equal(createdDto.cancelledAt, null);
            assert.equal(createdDto.createdAt, "2026-10-20T08:15:00.000Z");

            // Verify internal model in repository actually contains internalNote
            const rawModel = await reservationsRepository.findById(createdDto.id);
            assert.equal(rawModel.internalNote, "created via API v2");
        });

        it("Rejects cancelling a reservation that has already started (409 RESERVATION_ALREADY_STARTED)", async () => {
            // Seeded reservation id=1 has startTime 2026-01-15T09:00:00.000Z <= currentNow
            const res = await fetch(`${baseUrl}/api/reservations/1/cancel`, {
                method: "PATCH"
            });
            const body = await res.json();

            assert.equal(res.status, 409);
            assert.equal(body.error.code, "RESERVATION_ALREADY_STARTED");
        });

        it("Cancels future reservation and ensures idempotent repeated cancellation with unchanged cancelledAt", async () => {
            const createRes = await fetch(`${baseUrl}/api/reservations`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    roomId: 1,
                    reservedBy: "Jan Kowalski",
                    participants: 20,
                    startTime: "2026-11-10T10:00:00.000Z",
                    endTime: "2026-11-10T12:00:00.000Z"
                })
            });
            const created = await createRes.json();

            // First cancellation at T1
            currentNow = new Date("2026-10-21T12:00:00.000Z");
            const firstCancelRes = await fetch(`${baseUrl}/api/reservations/${created.id}/cancel`, {
                method: "PATCH"
            });
            const firstCancelBody = await firstCancelRes.json();

            assert.equal(firstCancelRes.status, 200);
            assert.equal(firstCancelBody.status, "CANCELLED");
            assert.equal(firstCancelBody.cancelledAt, "2026-10-21T12:00:00.000Z");
            assert.equal(firstCancelBody.internalNote, undefined);

            // Second cancellation at T2 (later time) -> idempotent 200, cancelledAt must NOT change
            currentNow = new Date("2026-10-25T18:30:00.000Z");
            const secondCancelRes = await fetch(`${baseUrl}/api/reservations/${created.id}/cancel`, {
                method: "PATCH"
            });
            const secondCancelBody = await secondCancelRes.json();

            assert.equal(secondCancelRes.status, 200);
            assert.equal(secondCancelBody.status, "CANCELLED");
            assert.equal(secondCancelBody.cancelledAt, "2026-10-21T12:00:00.000Z");
        });

        it("Defines state transitions as a data map (ALLOWED_TRANSITIONS)", () => {
            assert.deepEqual(ALLOWED_TRANSITIONS, {
                CONFIRMED: ["CANCELLED"],
                CANCELLED: []
            });
        });
    });
});

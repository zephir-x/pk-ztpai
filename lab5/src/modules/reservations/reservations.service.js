const { NotFoundError, ConflictError, ValidationError } = require("../../errors/AppError");
const { noopEventBus } = require("../../events/eventBus");

const MIN_DURATION_MS = 15 * 60 * 1000;
const MAX_DURATION_MS = 8 * 60 * 60 * 1000;

const ALLOWED_TRANSITIONS = {
    CONFIRMED: ["CANCELLED"],
    CANCELLED: []
};

function createReservationsService({ runInTransaction, eventBus = noopEventBus, now = () => new Date() }) {
    async function createReservation(input, currentUser) {
        const created = await runInTransaction(async ({ rooms, reservations }) => {
            const currentTime = now();
            const startMs = new Date(input.startTime).getTime();
            const endMs = new Date(input.endTime).getTime();
            const nowMs = currentTime.getTime();

            const validationDetails = [];

            if (startMs <= nowMs) {
                validationDetails.push({ location: "body", field: "startTime", message: "Start time cannot be in the past" });
            }

            if (endMs <= startMs) {
                validationDetails.push({ location: "body", field: "endTime", message: "End time must be later than start time" });
            } else {
                const durationMs = endMs - startMs;
                if (durationMs < MIN_DURATION_MS || durationMs > MAX_DURATION_MS) {
                    validationDetails.push({ location: "body", field: "endTime", message: "Reservation duration must be between 15 minutes and 8 hours" });
                }
            }

            if (validationDetails.length > 0) {
                throw new ValidationError(validationDetails);
            }

            const room = await rooms.findById(input.roomId);
            if (!room) {
                throw new NotFoundError("Room");
            }

            if (input.participants > room.capacity) {
                throw new ConflictError("Room capacity exceeded", "ROOM_CAPACITY_EXCEEDED");
            }

            // Lock the room row for the duration of the transaction to prevent concurrent booking anomalies
            await rooms.lockById(input.roomId);

            const { items: activeReservations } = await reservations.list({
                roomId: input.roomId,
                status: "CONFIRMED"
            });

            const hasOverlap = activeReservations.some(existing => {
                const existingStartMs = new Date(existing.startTime).getTime();
                const existingEndMs = new Date(existing.endTime).getTime();
                return startMs <= existingEndMs && existingStartMs <= endMs;
            });

            if (hasOverlap) {
                throw new ConflictError("Room is already booked for the selected time range", "ROOM_ALREADY_BOOKED");
            }

            return reservations.create({
                roomId: input.roomId,
                userId: currentUser.id,
                participants: input.participants,
                startTime: new Date(startMs).toISOString(),
                endTime: new Date(endMs).toISOString(),
                status: "CONFIRMED"
            });
        });

        // Publish domain event strictly after database transaction commits
        eventBus.publish("reservation.created", {
            reservationId: created.id,
            roomId: created.room?.id ?? created.roomId ?? input.roomId,
            userId: currentUser.id,
            startTime: new Date(created.startTime).toISOString(),
            endTime: new Date(created.endTime).toISOString()
        });

        return created;
    }

    async function listReservations(filters = {}, currentUser) {
        return runInTransaction(async ({ reservations }) => {
            const effectiveFilters = { ...filters };

            if (currentUser.role !== "ADMIN") {
                effectiveFilters.userId = currentUser.id; // Overwrite any attempt to inject ?userId= into the URL
            } else if (filters.userId) {
                effectiveFilters.userId = filters.userId; // ADMIN can filter by user
            }

            const { items, total } = await reservations.list(effectiveFilters);
            return {
                items,
                meta: {
                    page: effectiveFilters.page,
                    limit: effectiveFilters.limit,
                    total,
                    totalPages: Math.ceil(total / effectiveFilters.limit)
                }
            };
        });
    }

    async function getReservationById(id, currentUser) {
        return runInTransaction(async ({ reservations }) => {
            const reservation = await reservations.findById(id);
            if (!reservation) {
                throw new NotFoundError("Reservation");
            }

            // Ownership Guard: return 404 instead of 403 to conceal the existence of another user's reservation
            const isOwner = reservation.user && reservation.user.id === currentUser.id;
            if (!isOwner && currentUser.role !== "ADMIN") {
                throw new NotFoundError("Reservation");
            }

            return reservation;
        });
    }

    async function cancelReservation(id, currentUser) {
        let previousStatus;
        let ownerId;
        let targetRoomId;

        const updated = await runInTransaction(async ({ reservations }) => {
            const reservation = await reservations.findById(id);
            if (!reservation) {
                throw new NotFoundError("Reservation");
            }

            // Ownership Guard: return 404 instead of 403 to conceal the existence of another user's reservation
            const isOwner = reservation.user && reservation.user.id === currentUser.id;
            if (!isOwner && currentUser.role !== "ADMIN") {
                throw new NotFoundError("Reservation");
            }

            previousStatus = reservation.status;
            ownerId = reservation.user?.id ?? reservation.userId;
            targetRoomId = reservation.room?.id ?? reservation.roomId;

            const newStatus = "CANCELLED";

            if (reservation.status === newStatus) {
                return reservation;
            }

            if (!ALLOWED_TRANSITIONS[reservation.status]?.includes(newStatus)) {
                throw new ConflictError(`Cannot change status from ${reservation.status} to ${newStatus}`, "INVALID_STATUS_TRANSITION");
            }

            const currentTime = now();
            if (new Date(reservation.startTime).getTime() <= currentTime.getTime()) {
                throw new ConflictError("Cannot cancel a reservation that has already started", "RESERVATION_ALREADY_STARTED");
            }

            return reservations.updateStatus(id, newStatus, { cancelledAt: currentTime.toISOString() });
        });

        // Publish cancellation event only after transaction commit and when status actually changed
        if (previousStatus !== "CANCELLED") {
            eventBus.publish("reservation.cancelled", {
                reservationId: updated.id,
                roomId: targetRoomId,
                userId: ownerId,
                cancelledBy: currentUser.id
            });
        }

        return updated;
    }

    return { createReservation, listReservations, getReservationById, cancelReservation };
}

module.exports = { createReservationsService, MIN_DURATION_MS, MAX_DURATION_MS, ALLOWED_TRANSITIONS };

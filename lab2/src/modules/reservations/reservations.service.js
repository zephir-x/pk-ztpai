const { NotFoundError, ConflictError, ValidationError } = require("../../errors/AppError");

// Duration constraints for reservations: minimum 15 minutes, maximum 8 hours
const MIN_DURATION_MS = 15 * 60 * 1000;
const MAX_DURATION_MS = 8 * 60 * 60 * 1000;

// State machine defining allowed reservation status transitions
const ALLOWED_TRANSITIONS = {
    CONFIRMED: ["CANCELLED"],
    CANCELLED: []
};

// Service implementing reservation business rules and state transitions
function createReservationsService({ roomsRepository, reservationsRepository, now = () => new Date() }) {
    async function createReservation(input) {
        const currentTime = now();
        const startMs = new Date(input.startTime).getTime();
        const endMs = new Date(input.endTime).getTime();
        const nowMs = currentTime.getTime();

        const validationDetails = [];

        // Business rule: Start time cannot be in the past
        if (startMs <= nowMs) {
            validationDetails.push({
                location: "body",
                field: "startTime",
                message: "Start time cannot be in the past"
            });
        }

        // Business rule: End time must be strictly after start time
        if (endMs <= startMs) {
            validationDetails.push({
                location: "body",
                field: "endTime",
                message: "End time must be later than start time"
            });
        } else {
            // Business rule: Duration must be between 15 minutes and 8 hours
            const durationMs = endMs - startMs;
            if (durationMs < MIN_DURATION_MS || durationMs > MAX_DURATION_MS) {
                validationDetails.push({
                    location: "body",
                    field: "endTime",
                    message: "Reservation duration must be between 15 minutes and 8 hours"
                });
            }
        }

        if (validationDetails.length > 0) {
            throw new ValidationError(validationDetails);
        }

        // Validate room existence
        const room = await roomsRepository.findById(input.roomId);
        if (!room) {
            throw new NotFoundError("Room");
        }

        // Business rule: Check if room capacity is exceeded
        if (input.participants > room.capacity) {
            throw new ConflictError("Room capacity exceeded", "ROOM_CAPACITY_EXCEEDED");
        }

        // Business rule: Prevent overlapping CONFIRMED reservations on the same room
        // Half-open intervals [startTime, endTime) overlap iff A.start < B.end AND B.start < A.end
        const activeReservations = await reservationsRepository.list({
            roomId: input.roomId,
            status: "CONFIRMED"
        });

        const hasOverlap = activeReservations.some(existing => {
            const existingStartMs = new Date(existing.startTime).getTime();
            const existingEndMs = new Date(existing.endTime).getTime();
            return startMs < existingEndMs && existingStartMs < endMs;
        });

        if (hasOverlap) {
            throw new ConflictError(
                "Room is already booked for the selected time range",
                "ROOM_ALREADY_BOOKED"
            );
        }

        return reservationsRepository.create({
            roomId: input.roomId,
            reservedBy: input.reservedBy,
            participants: input.participants,
            startTime: new Date(startMs).toISOString(),
            endTime: new Date(endMs).toISOString(),
            status: "CONFIRMED",
            createdAt: currentTime.toISOString(),
            cancelledAt: null,
            internalNote: "created via API v2"
        });
    }

    async function listReservations(filters = {}) {
        return reservationsRepository.list(filters);
    }

    async function cancelReservation(id) {
        const reservation = await reservationsRepository.findById(id);
        if (!reservation) {
            throw new NotFoundError("Reservation");
        }

        const newStatus = "CANCELLED";

        // Idempotent operation: cancelling an already cancelled reservation returns it unchanged
        if (reservation.status === newStatus) {
            return reservation;
        }

        // State machine verification
        if (!ALLOWED_TRANSITIONS[reservation.status]?.includes(newStatus)) {
            throw new ConflictError(
                `Cannot change status from ${reservation.status} to ${newStatus}`,
                "INVALID_STATUS_TRANSITION"
            );
        }

        // Business rule: Cannot cancel a reservation that has already started (startTime <= now)
        const currentTime = now();
        if (new Date(reservation.startTime).getTime() <= currentTime.getTime()) {
            throw new ConflictError(
                "Cannot cancel a reservation that has already started",
                "RESERVATION_ALREADY_STARTED"
            );
        }

        return reservationsRepository.updateStatus(id, newStatus, {
            cancelledAt: currentTime.toISOString()
        });
    }

    return {
        createReservation,
        listReservations,
        cancelReservation
    };
}

module.exports = {
    createReservationsService,
    MIN_DURATION_MS,
    MAX_DURATION_MS,
    ALLOWED_TRANSITIONS
};

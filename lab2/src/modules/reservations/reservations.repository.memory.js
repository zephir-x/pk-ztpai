// Default seed data containing a historical reservation that has already started
const DEFAULT_RESERVATIONS = [
    {
        id: 1,
        roomId: 1,
        reservedBy: "Marek Nowak",
        participants: 10,
        startTime: "2026-01-15T09:00:00.000Z",
        endTime: "2026-01-15T11:00:00.000Z",
        status: "CONFIRMED",
        createdAt: "2026-01-10T08:00:00.000Z",
        cancelledAt: null,
        internalNote: "created via API v2"
    }
];

// Factory creating an isolated in-memory reservations repository instance
function createInMemoryReservationsRepository(seed = DEFAULT_RESERVATIONS) {
    const state = {
        reservations: structuredClone(seed)
    };

    let nextReservationId = Math.max(0, ...state.reservations.map(r => r.id)) + 1;

    return {
        async findById(id) {
            return state.reservations.find(r => r.id === id) ?? null;
        },

        async list({ roomId, status } = {}) {
            return state.reservations.filter(r =>
                (roomId === undefined || r.roomId === roomId) &&
                (status === undefined || r.status === status)
            );
        },

        async create(data) {
            const reservation = {
                id: nextReservationId++,
                status: "CONFIRMED",
                createdAt: new Date().toISOString(),
                cancelledAt: null,
                internalNote: "created via API v2",
                ...data
            };
            state.reservations.push(reservation);
            return reservation;
        },

        async updateStatus(id, status, extra = {}) {
            const reservation = state.reservations.find(r => r.id === id);
            if (!reservation) {
                return null;
            }
            reservation.status = status;
            Object.assign(reservation, extra);
            return reservation;
        }
    };
}

module.exports = { createInMemoryReservationsRepository };

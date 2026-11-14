// Default seed data containing a historical reservation that has already started
const DEFAULT_RESERVATIONS = [
    {
        id: 1,
        roomId: 1,
        room: { id: 1, name: "A101", building: { id: 1, name: "Main Building" } },
        userId: 1,
        user: { id: 1, email: "owner@example.com" },
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
        reservations: structuredClone(seed).map(r => ({
            ...r,
            userId: r.userId ?? r.user?.id ?? 1,
            user: r.user ?? { id: r.userId ?? 1, email: `user${r.userId ?? 1}@example.com` },
            room: r.room ?? { id: r.roomId, name: `Room ${r.roomId}`, building: { id: 1, name: "Main Building" } }
        }))
    };

    let nextReservationId = Math.max(0, ...state.reservations.map(r => r.id)) + 1;

    return {
        async findById(id) {
            return state.reservations.find(r => r.id === id) ?? null;
        },

        async list({ roomId, status, userId, page = 1, limit = 100 } = {}) {
            const filtered = state.reservations.filter(r =>
                (roomId === undefined || r.roomId === roomId) &&
                (status === undefined || r.status === status) &&
                (userId === undefined || r.user?.id === userId || r.userId === userId)
            );
            const start = (page - 1) * limit;
            return {
                items: filtered.slice(start, start + limit),
                total: filtered.length
            };
        },

        async create(data) {
            const reservation = {
                id: nextReservationId++,
                roomId: data.roomId,
                room: { id: data.roomId, name: `Room ${data.roomId}`, building: { id: 1, name: "Main Building" } },
                userId: data.userId,
                user: { id: data.userId, email: `user${data.userId}@example.com` },
                participants: data.participants,
                startTime: data.startTime,
                endTime: data.endTime,
                status: data.status ?? "CONFIRMED",
                createdAt: new Date().toISOString(),
                cancelledAt: null,
                internalNote: "created via API v2"
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

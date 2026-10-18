// Default seed data for available rooms
const DEFAULT_ROOMS = [
    { id: 1, name: "A101", capacity: 30 },
    { id: 2, name: "B202", capacity: 15 },
    { id: 3, name: "C303", capacity: 50 },
    { id: 4, name: "D404", capacity: 120 }
];

// Factory creating an isolated in-memory rooms repository instance
function createInMemoryRoomsRepository(seed = DEFAULT_ROOMS) {
    const state = {
        rooms: structuredClone(seed)
    };

    return {
        async list() {
            return state.rooms;
        },

        async findById(id) {
            return state.rooms.find(r => r.id === id) ?? null;
        }
    };
}

module.exports = { createInMemoryRoomsRepository };

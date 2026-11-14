const { createInMemoryRoomsRepository } = require("./rooms/rooms.repository.memory");
const { createInMemoryReservationsRepository } = require("./reservations/reservations.repository.memory");

// Factory creating an isolated in-memory Unit of Work for fast unit testing without database connections
function createInMemoryRepositories({ rooms, reservations } = {}) {
    const repos = {
        rooms: createInMemoryRoomsRepository(rooms),
        reservations: createInMemoryReservationsRepository(reservations)
    };

    return {
        ...repos,
        runInTransaction: async fn => fn(repos)
    };
}

module.exports = { createInMemoryRepositories };

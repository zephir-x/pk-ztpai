const { createKnexBuildingsRepository } = require("./buildings/buildings.repository.knex");
const { createKnexRoomsRepository } = require("./rooms/rooms.repository.knex");
const { createKnexReservationsRepository } = require("./reservations/reservations.repository.knex");

function createKnexRepositories(db) {
    return {
        buildings: createKnexBuildingsRepository(db),
        rooms: createKnexRoomsRepository(db),
        reservations: createKnexReservationsRepository(db)
    };
}

function createKnexUnitOfWork(db) {
    return {
        runInTransaction: fn => db.transaction(trx => fn(createKnexRepositories(trx))),
        // Fallback: exposing repositories without transaction for simple GET endpoints
        ...createKnexRepositories(db)
    };
}
module.exports = { createKnexUnitOfWork };

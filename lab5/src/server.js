const config = require("./config");
const { createApp } = require("./app");
const db = require("./db/knex");
const { createKnexUnitOfWork } = require("./modules/unitOfWork.knex");
const { createUsersRepository } = require("./modules/auth/users.repository.knex");
const { createEventBus } = require("./events/eventBus");
const { registerAuditListeners } = require("./events/auditListeners");

const usersRepository = createUsersRepository(db);
const eventBus = createEventBus();
registerAuditListeners(eventBus, db, usersRepository);

const app = createApp({
    uow: createKnexUnitOfWork(db),
    config,
    usersRepository,
    eventBus
});

const server = app.listen(config.PORT, () => {
    console.log(`Server running on http://localhost:${config.PORT} in ${config.NODE_ENV} mode`);
});

// Gracefully stop accepting new HTTP connections and release database pool on orchestrator signals
async function shutdown(signal) {
    console.log(`${signal} received, shutting down`);
    server.close(async () => {
        await db.destroy();
        process.exit(0);
    });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

const express = require("express");
const requestLogger = require("./middleware/requestLogger");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");
const { createRoomsService } = require("./modules/rooms/rooms.service");
const { createRoomsController } = require("./modules/rooms/rooms.controller");
const { createRoomsRouter } = require("./modules/rooms/rooms.routes");
const { createReservationsService } = require("./modules/reservations/reservations.service");
const { createReservationsController } = require("./modules/reservations/reservations.controller");
const { createReservationsRouter } = require("./modules/reservations/reservations.routes");
const { createBuildingsService } = require("./modules/buildings/buildings.service");
const { createBuildingsController } = require("./modules/buildings/buildings.controller");
const { createBuildingsRouter } = require("./modules/buildings/buildings.routes");
const { createKnexUnitOfWork } = require("./modules/unitOfWork.knex");

// Factory function constructing the Express application with injected dependencies
function createApp({ uow, now }) {
    const app = express();

    // Register request logger first to capture full request execution time
    app.use(requestLogger);

    // Add middleware to parse JSON bodies
    app.use(express.json());

    // Wire rooms module layers with runInTransaction
    const roomsService = createRoomsService({ runInTransaction: uow.runInTransaction });
    const roomsController = createRoomsController(roomsService);
    app.use("/api/rooms", createRoomsRouter(roomsController));

    // Wire reservations module layers with runInTransaction
    const reservationsService = createReservationsService({ runInTransaction: uow.runInTransaction, now });
    const reservationsController = createReservationsController(reservationsService);
    app.use("/api/reservations", createReservationsRouter(reservationsController));

    // Wire buildings module layers with runInTransaction
    const buildingsService = createBuildingsService({ runInTransaction: uow.runInTransaction });
    const buildingsController = createBuildingsController(buildingsService);
    app.use("/api/buildings", createBuildingsRouter(buildingsController));
    
    // Temporary diagnostic endpoint demonstrating 500 internal error handling (Task 3)
    app.get("/api/debug/crash", () => {
        throw new Error("boom");
    });

    // Catch-all for unknown routes and centralized error handling
    app.use(notFound);
    app.use(errorHandler);

    return app;
}

module.exports = { createApp };

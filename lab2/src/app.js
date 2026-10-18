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

// Factory function constructing the Express application with injected dependencies
function createApp({ roomsRepository, reservationsRepository, now }) {
    const app = express();

    // Register request logger first to capture full request execution time
    app.use(requestLogger);

    // Add middleware to parse JSON bodies
    app.use(express.json());

    // Wire rooms module layers
    const roomsService = createRoomsService({ roomsRepository });
    const roomsController = createRoomsController(roomsService);
    app.use("/api/rooms", createRoomsRouter(roomsController));

    // Wire reservations module layers
    const reservationsService = createReservationsService({
        roomsRepository,
        reservationsRepository,
        now
    });
    const reservationsController = createReservationsController(reservationsService);
    app.use("/api/reservations", createReservationsRouter(reservationsController));

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

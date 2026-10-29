const express = require("express");
const swaggerUi = require("swagger-ui-express");
const openapiDocument = require("./docs/openapi.json");
const requestLogger = require("./middleware/requestLogger");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");
const authenticate = require("./middleware/authenticate");

const { createRoomsService } = require("./modules/rooms/rooms.service");
const { createRoomsController } = require("./modules/rooms/rooms.controller");
const { createRoomsRouter } = require("./modules/rooms/rooms.routes");
const { createReservationsService } = require("./modules/reservations/reservations.service");
const { createReservationsController } = require("./modules/reservations/reservations.controller");
const { createReservationsRouter } = require("./modules/reservations/reservations.routes");
const { createBuildingsService } = require("./modules/buildings/buildings.service");
const { createBuildingsController } = require("./modules/buildings/buildings.controller");
const { createBuildingsRouter } = require("./modules/buildings/buildings.routes");

const { createAuthService } = require("./modules/auth/auth.service");
const { createAuthController } = require("./modules/auth/auth.controller");
const { createAuthRouter } = require("./modules/auth/auth.routes");

function createApp({ uow, now, config, usersRepository }) {
    const app = express();

    app.use(requestLogger);
    app.use(express.json());

    // Initialization of Swagger UI documentation (public endpoint)
    app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapiDocument));

    // Initialization of security
    const requireAuth = authenticate(config.JWT_SECRET);

    // Public module (registration/login)
    const authService = createAuthService({
        usersRepository,
        jwtSecret: config.JWT_SECRET,
        jwtExpiresIn: config.JWT_EXPIRES_IN
    });
    const authController = createAuthController(authService);
    app.use("/api/auth", createAuthRouter(authController, requireAuth));

    // Protected business modules
    const buildingsService = createBuildingsService({ runInTransaction: uow.runInTransaction });
    const buildingsController = createBuildingsController(buildingsService);
    app.use("/api/buildings", requireAuth, createBuildingsRouter(buildingsController));

    const roomsService = createRoomsService({ runInTransaction: uow.runInTransaction });
    const roomsController = createRoomsController(roomsService);
    app.use("/api/rooms", requireAuth, createRoomsRouter(roomsController));

    const reservationsService = createReservationsService({ runInTransaction: uow.runInTransaction, now });
    const reservationsController = createReservationsController(reservationsService);
    app.use("/api/reservations", requireAuth, createReservationsRouter(reservationsController));

    app.get("/api/debug/crash", () => {
        throw new Error("boom");
    });

    app.use(notFound);
    app.use(errorHandler);

    return app;
}

module.exports = { createApp };

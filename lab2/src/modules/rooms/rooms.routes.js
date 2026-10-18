const { Router } = require("express");
const validate = require("../../middleware/validate");
const { idParams } = require("./rooms.schemas");

// Router binding room endpoints with validation middleware and controller handlers
function createRoomsRouter(controller) {
    const router = Router();

    router.get("/", controller.list);
    router.get("/:id", validate({ params: idParams }), controller.getById);

    return router;
}

module.exports = { createRoomsRouter };

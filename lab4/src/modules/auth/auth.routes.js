const { Router } = require("express");
const validate = require("../../middleware/validate");
const { registerBody, loginBody } = require("./auth.schemas");

function createAuthRouter(authController, authenticateMiddleware) {
    const router = Router();

    router.post("/register", validate({ body: registerBody }), authController.register);
    router.post("/login", validate({ body: loginBody }), authController.login);
    router.get("/me", authenticateMiddleware, authController.getMe);

    return router;
}

module.exports = { createAuthRouter };

const { toUserResponse } = require("./auth.mapper");

function createAuthController(authService) {
    async function register(req, res) {
        const user = await authService.register(req.validated.body);
        res.status(201).json(toUserResponse(user));
    }

    async function login(req, res) {
        const result = await authService.login(req.validated.body);
        res.json(result);
    }

    async function getMe(req, res) {
        const user = await authService.getProfile(req.user.id);
        res.json(toUserResponse(user));
    }

    return { register, login, getMe };
}

module.exports = { createAuthController };

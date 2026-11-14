const jwt = require("jsonwebtoken");
const { UnauthorizedError } = require("../errors/AppError");

function authenticate(jwtSecret) {
    return (req, res, next) => {
        const header = req.get("Authorization");
        if (!header || !header.startsWith("Bearer ")) {
            return next(new UnauthorizedError("Missing or invalid token format"));
        }

        const token = header.slice("Bearer ".length);
        try {
            const payload = jwt.verify(token, jwtSecret, { algorithms: ["HS256"] });

            // From now on, req.user is the only trusted source of identity
            req.user = { id: Number(payload.sub), role: payload.role };
            next();
        } catch (err) {
            const message = err.name === "TokenExpiredError" ? "Token expired" : "Invalid token";
            next(new UnauthorizedError(message));
        }
    };
}

module.exports = authenticate;

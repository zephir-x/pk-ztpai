const { NotFoundError } = require("../errors/AppError");

// Middleware handling unknown API routes with a JSON 404 response
function notFound(req, res, next) {
    next(new NotFoundError(`Route ${req.method} ${req.originalUrl}`));
}

module.exports = notFound;

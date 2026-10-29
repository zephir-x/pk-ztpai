const { AppError } = require("../errors/AppError");

// Global error-handling middleware formatting all errors into a consistent JSON structure
function errorHandler(err, req, res, next) {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            error: {
                code: err.code,
                message: err.message,
                details: err.details,
                requestId: req.id
            }
        });
    }

    if (err.type === "entity.parse.failed") {
        return res.status(400).json({
            error: {
                code: "INVALID_JSON",
                message: "Request body is not valid JSON",
                requestId: req.id
            }
        });
    }

    // Handle PostgreSQL unique constraint violation (e.g. duplicate room name in a building)
    if (err.code === "23505") {
        return res.status(409).json({
            error: {
                code: "UNIQUE_VIOLATION",
                message: "Resource already exists or violates unique constraint",
                requestId: req.id
            }
        });
    }

    // Handle PostgreSQL exclusion constraint violation (e.g. overlapping dates)
    if (err.code === "23P01") {
        return res.status(409).json({
            error: {
                code: "ROOM_ALREADY_BOOKED",
                message: "Room is already booked for the selected time range (caught by DB)",
                requestId: req.id
            }
        });
    }

    console.error(`[${req.id}]`, err);
    res.status(500).json({
        error: {
            code: "INTERNAL_ERROR",
            message: "Unexpected error",
            requestId: req.id
        }
    });
}

module.exports = errorHandler;

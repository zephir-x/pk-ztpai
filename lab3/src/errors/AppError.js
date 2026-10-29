// Base class for domain and application errors
class AppError extends Error {
    constructor(message, statusCode, code, details) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
    }
}

// Error thrown when request data fails validation or time constraints (400 Bad Request)
class ValidationError extends AppError {
    constructor(details, message = "Validation failed") {
        super(message, 400, "VALIDATION_ERROR", details);
    }
}

// Error thrown when a requested resource does not exist (404 Not Found)
class NotFoundError extends AppError {
    constructor(resource) {
        super(`${resource} not found`, 404, "NOT_FOUND");
    }
}

// Error thrown when a business rule or state conflict occurs (409 Conflict)
class ConflictError extends AppError {
    constructor(message, code = "CONFLICT") {
        super(message, 409, code);
    }
}

module.exports = {
    AppError,
    ValidationError,
    NotFoundError,
    ConflictError
};

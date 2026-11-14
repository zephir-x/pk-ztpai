// Base class for domain and application errors
class AppError extends Error {
    constructor(message, statusCode, code, details) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
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

// Error thrown when authentication is missing or invalid (401 Unauthorized)
class UnauthorizedError extends AppError {
    constructor(message = "Authentication required") {
        super(message, 401, "UNAUTHORIZED");
    }
}

// Error thrown when a user lacks permissions to access a resource (403 Forbidden)
class ForbiddenError extends AppError {
    constructor(message = "Insufficient permissions") {
        super(message, 403, "FORBIDDEN");
    }
}

module.exports = {
    AppError,
    ValidationError,
    NotFoundError,
    ConflictError,
    UnauthorizedError,
    ForbiddenError
};

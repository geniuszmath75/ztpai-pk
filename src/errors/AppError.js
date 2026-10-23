class AppError extends Error {
    constructor(statusCode, code, message, details = undefined) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
    }
}

class ValidationError extends AppError {
    constructor(details) {
        super(400, 'VALIDATION_ERROR', 'Validation failed', details);
    }
}

class BadRequestError extends AppError {
    constructor(code, message) {
        super(400, code, message);
    }
}

class NotFoundError extends AppError {
    constructor(message = 'Not found') {
        super(404, 'NOT_FOUND', message);
    }
}

class ConflictError extends AppError {
    constructor(code, message) {
        super(409, code, message);
    }
}

export { AppError, ValidationError, BadRequestError, NotFoundError, ConflictError };

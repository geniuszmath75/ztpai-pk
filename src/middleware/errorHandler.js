import { AppError } from '../errors/AppError.js';

function notFoundHandler(req, _res, next) {
    next(new AppError(404, 'NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`));
}

function errorHandler(err, req, res, _next) {
    const requestId = req.requestId;

    if (err instanceof SyntaxError && 'body' in err) {
        return res.status(400).json({
            error: {
                code: 'INVALID_JSON',
                message: 'Invalid JSON in request body',
                requestId
            }
        });
    }

    // PostgreSQL unique_violation — bez wycieku szczegółów bazy
    if (err.code === '23505') {
        return res.status(409).json({
            error: {
                code: 'CONFLICT',
                message: 'Resource already exists',
                requestId
            }
        });
    }

    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            error: {
                code: err.code,
                message: err.message,
                ...(err.details !== undefined ? { details: err.details } : {}),
                requestId
            }
        });
    }

    console.error({ requestId, err });
    return res.status(500).json({
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
            requestId
        }
    });
}

export { notFoundHandler, errorHandler };

import { randomUUID } from 'crypto';

function requestLogger(req, res, next) {
    const requestId = req.header('X-Request-Id') || randomUUID();
    req.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);

    const startedAt = Date.now();

    res.on('finish', () => {
        console.log(
            JSON.stringify({
                requestId,
                method: req.method,
                url: req.originalUrl,
                statusCode: res.statusCode,
                durationMs: Date.now() - startedAt
            })
        );
    });

    next();
}

export { requestLogger };

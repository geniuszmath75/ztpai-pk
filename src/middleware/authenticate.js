import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../errors/AppError.js';

function createAuthenticate({ jwtSecret }) {
    return (req, _res, next) => {
        const header = req.headers.authorization;
        if (!header || !header.startsWith('Bearer ')) {
            return next(new UnauthorizedError('Missing or invalid Authorization header'));
        }

        const token = header.slice('Bearer '.length).trim();
        if (!token) {
            return next(new UnauthorizedError('Missing or invalid Authorization header'));
        }

        try {
            const payload = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
            req.user = { id: Number(payload.sub), role: payload.role };
            return next();
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                return next(new UnauthorizedError('Token expired'));
            }
            return next(new UnauthorizedError('Invalid token'));
        }
    };
}

export { createAuthenticate };

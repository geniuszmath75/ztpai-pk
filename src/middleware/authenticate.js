import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../errors/AppError.js';

function createAuthenticate({ jwtSecret }) {
    return (req, _res, next) => {
        const header = req.headers.authorization;
        if (!header) {
            return next(new UnauthorizedError('Missing Authorization header'));
        }

        // tylko Bearer <token>
        const [scheme, token, ...rest] = header.split(' ');
        if (scheme !== 'Bearer' || !token || rest.length > 0) {
            return next(new UnauthorizedError('Invalid Authorization header'));
        }

        try {
            const payload = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
            req.user = { id: Number(payload.sub), role: payload.role };
            return next();
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                return next(new UnauthorizedError('Token expired'));
            }
            // zły podpis / zmodyfikowany payload / uszkodzony token
            return next(new UnauthorizedError('Invalid token'));
        }
    };
}

export { createAuthenticate };

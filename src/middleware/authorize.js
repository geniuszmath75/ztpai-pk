import { ForbiddenError } from '../errors/AppError.js';

function authorize(...roles) {
    return (req, _res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new ForbiddenError('Forbidden'));
        }
        return next();
    };
}

export { authorize };

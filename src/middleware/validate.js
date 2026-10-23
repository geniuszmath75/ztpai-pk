import { ValidationError } from '../errors/AppError.js';

function formatIssues(location, error) {
    return error.issues.map((issue) => ({
        location,
        field: issue.path.length ? issue.path.join('.') : '(root)',
        message: issue.message
    }));
}

function validate({ params, query, body } = {}) {
    return (req, _res, next) => {
        const details = [];
        const validated = {};

        if (params) {
            const result = params.safeParse(req.params);
            if (result.success) {
                validated.params = result.data;
            } else {
                details.push(...formatIssues('params', result.error));
            }
        }

        if (query) {
            const result = query.safeParse(req.query);
            if (result.success) {
                validated.query = result.data;
            } else {
                details.push(...formatIssues('query', result.error));
            }
        }

        if (body) {
            const result = body.safeParse(req.body);
            if (result.success) {
                validated.body = result.data;
            } else {
                details.push(...formatIssues('body', result.error));
            }
        }

        if (details.length > 0) {
            return next(new ValidationError(details));
        }

        req.validated = validated;
        next();
    };
}

export { validate };

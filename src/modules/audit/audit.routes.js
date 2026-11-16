import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { auditLogQuerySchema } from './audit.schemas.js';

function createAuditLogRouter({ auditLogController }) {
    const router = Router();

    router.get('/', validate({ query: auditLogQuerySchema }), auditLogController.list);

    return router;
}

export { createAuditLogRouter };

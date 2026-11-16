import { z } from 'zod';
import { positiveIntParam } from '../rooms/rooms.schemas.js';

const limitParam = z
    .string()
    .regex(/^[1-9]\d*$/, 'Must be a positive integer')
    .transform(Number)
    .pipe(z.number().int().min(1).max(100));

const auditLogQuerySchema = z
    .object({
        eventType: z.enum(['reservation.created', 'reservation.cancelled']).optional(),
        page: positiveIntParam.optional().default(1),
        limit: limitParam.optional().default(20)
    })
    .strict();

export { auditLogQuerySchema };

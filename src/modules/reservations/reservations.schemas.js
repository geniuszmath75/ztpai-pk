import { z } from 'zod';
import { positiveIntParam } from '../rooms/rooms.schemas.js';

// userId/reservedBy w body → 400 (strict); właściciel z tokenu
const createReservationBodySchema = z
    .object({
        roomId: z.number().int().positive(),
        participants: z.number().int().positive(),
        startTime: z.iso.datetime({ offset: true }),
        endTime: z.iso.datetime({ offset: true })
    })
    .strict();

const reservationIdParamsSchema = z
    .object({
        id: positiveIntParam
    })
    .strict();

const limitParam = z
    .string()
    .regex(/^[1-9]\d*$/, 'Must be a positive integer')
    .transform(Number)
    .pipe(z.number().int().min(1).max(100));

const SORT_VALUES = [
    'startTime',
    '-startTime',
    'createdAt',
    '-createdAt',
    'participants',
    '-participants'
];

const listReservationsQuerySchema = z
    .object({
        roomId: positiveIntParam.optional(),
        buildingId: positiveIntParam.optional(),
        status: z.enum(['CONFIRMED', 'CANCELLED']).optional(),
        from: z.iso.datetime({ offset: true }).optional(),
        to: z.iso.datetime({ offset: true }).optional(),
        page: positiveIntParam.optional().default(1),
        limit: limitParam.optional().default(20),
        sort: z.enum(SORT_VALUES).optional().default('startTime')
    })
    .strict()
    .refine(
        (q) => !(q.from !== undefined && q.to !== undefined && q.from >= q.to),
        { message: 'from must be earlier than to', path: ['from'] }
    );

export {
    createReservationBodySchema,
    reservationIdParamsSchema,
    listReservationsQuerySchema,
    SORT_VALUES
};

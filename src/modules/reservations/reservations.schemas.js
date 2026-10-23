import { z } from 'zod';
import { positiveIntParam } from '../rooms/rooms.schemas.js';

const createReservationBodySchema = z
    .object({
        roomId: z.number().int().positive(),
        reservedBy: z.string().trim().min(3).max(100),
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

const listReservationsQuerySchema = z
    .object({
        roomId: positiveIntParam.optional()
    })
    .strict();

export {
    createReservationBodySchema,
    reservationIdParamsSchema,
    listReservationsQuerySchema
};

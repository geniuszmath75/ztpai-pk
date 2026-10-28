import { z } from 'zod';

// param/query Express przekazuje jako string
const positiveIntParam = z
    .string()
    .regex(/^[1-9]\d*$/, 'Must be a positive integer')
    .transform(Number);

const roomIdParamsSchema = z
    .object({
        id: positiveIntParam
    })
    .strict();

const createRoomBodySchema = z
    .object({
        buildingId: z.number().int().positive(),
        name: z.string().trim().min(1).max(100),
        capacity: z.number().int().positive()
    })
    .strict();

export { roomIdParamsSchema, createRoomBodySchema, positiveIntParam };

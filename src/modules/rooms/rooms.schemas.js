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

export { roomIdParamsSchema, positiveIntParam };

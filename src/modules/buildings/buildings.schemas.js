import { z } from 'zod';
import { positiveIntParam } from '../rooms/rooms.schemas.js';

const buildingIdParamsSchema = z
    .object({
        id: positiveIntParam
    })
    .strict();

const createBuildingBodySchema = z
    .object({
        name: z.string().trim().min(1).max(100),
        address: z.string().trim().min(1).max(255)
    })
    .strict();

export { buildingIdParamsSchema, createBuildingBodySchema };

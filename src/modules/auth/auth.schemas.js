import { z } from 'zod';

const registerBodySchema = z
    .object({
        email: z
            .email()
            .transform((value) => value.toLowerCase()),
        password: z.string().min(10).max(72)
    })
    .strict();

const loginBodySchema = z
    .object({
        email: z
            .email()
            .transform((value) => value.toLowerCase()),
        password: z.string().min(1)
    })
    .strict();

export { registerBodySchema, loginBodySchema };

import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
    DATABASE_URL: z
        .string()
        .min(1, 'DATABASE_URL is required')
        .refine((value) => {
            try {
                const url = new URL(value);
                return url.protocol === 'postgres:' || url.protocol === 'postgresql:';
            } catch {
                return false;
            }
        }, 'DATABASE_URL must be a valid postgres:// or postgresql:// URL'),
    STORAGE: z.enum(['knex', 'memory']).default('knex'),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
    JWT_EXPIRES_IN: z.string().min(1).default('15m'),
    PORT: z.coerce.number().int().positive().default(3000)
});

function loadConfig() {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
        console.error('Invalid configuration — application will not start:');
        for (const issue of parsed.error.issues) {
            const path = issue.path.length ? issue.path.join('.') : '(root)';
            console.error(`  - ${path}: ${issue.message}`);
        }
        process.exit(1);
    }

    const env = parsed.data;
    return {
        databaseUrl: env.DATABASE_URL,
        storage: env.STORAGE,
        jwtSecret: env.JWT_SECRET,
        jwtExpiresIn: env.JWT_EXPIRES_IN,
        port: env.PORT
    };
}

const config = loadConfig();

export { config };

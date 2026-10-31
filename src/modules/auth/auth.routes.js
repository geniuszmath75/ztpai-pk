import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { registerBodySchema } from './auth.schemas.js';

function createAuthRouter({ authController }) {
    const router = Router();

    router.post('/register', validate({ body: registerBodySchema }), authController.register);

    return router;
}

export { createAuthRouter };

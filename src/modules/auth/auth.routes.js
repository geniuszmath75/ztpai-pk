import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { registerBodySchema, loginBodySchema } from './auth.schemas.js';

function createAuthRouter({ authController, authenticate }) {
    const router = Router();

    router.post('/register', validate({ body: registerBodySchema }), authController.register);
    router.post('/login', validate({ body: loginBodySchema }), authController.login);
    router.get('/me', authenticate, authController.me);

    return router;
}

export { createAuthRouter };

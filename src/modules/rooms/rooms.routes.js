import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { roomIdParamsSchema } from './rooms.schemas.js';

function createRoomsRouter({ roomsController }) {
    const router = Router();

    router.get('/', roomsController.list);
    router.get('/:id', validate({ params: roomIdParamsSchema }), roomsController.getById);

    return router;
}

export { createRoomsRouter };

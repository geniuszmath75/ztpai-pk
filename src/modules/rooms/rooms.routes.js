import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { authorize } from '../../middleware/authorize.js';
import { createRoomBodySchema, roomIdParamsSchema } from './rooms.schemas.js';

function createRoomsRouter({ roomsController }) {
    const router = Router();

    router.get('/', roomsController.list);
    router.post(
        '/',
        authorize('ADMIN'),
        validate({ body: createRoomBodySchema }),
        roomsController.create
    );
    router.get('/:id', validate({ params: roomIdParamsSchema }), roomsController.getById);

    return router;
}

export { createRoomsRouter };

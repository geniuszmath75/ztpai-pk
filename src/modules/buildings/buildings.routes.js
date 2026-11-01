import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { authorize } from '../../middleware/authorize.js';
import { buildingIdParamsSchema, createBuildingBodySchema } from './buildings.schemas.js';

function createBuildingsRouter({ buildingsController }) {
    const router = Router();

    router.get('/', buildingsController.list);
    router.get(
        '/:id/rooms',
        validate({ params: buildingIdParamsSchema }),
        buildingsController.listRooms
    );
    router.get('/:id', validate({ params: buildingIdParamsSchema }), buildingsController.getById);
    router.post(
        '/',
        authorize('ADMIN'),
        validate({ body: createBuildingBodySchema }),
        buildingsController.create
    );

    return router;
}

export { createBuildingsRouter };

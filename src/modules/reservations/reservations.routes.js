import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import {
    createReservationBodySchema,
    listReservationsQuerySchema,
    reservationIdParamsSchema
} from './reservations.schemas.js';

function createReservationsRouter({ reservationsController }) {
    const router = Router();

    router.get(
        '/',
        validate({ query: listReservationsQuerySchema }),
        reservationsController.list
    );

    router.get(
        '/:id',
        validate({ params: reservationIdParamsSchema }),
        reservationsController.getById
    );

    router.post(
        '/',
        validate({ body: createReservationBodySchema }),
        reservationsController.create
    );

    router.patch(
        '/:id/cancel',
        validate({ params: reservationIdParamsSchema }),
        reservationsController.cancel
    );

    return router;
}

export { createReservationsRouter };

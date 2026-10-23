import express from 'express';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { createRoomsService } from './modules/rooms/rooms.service.js';
import { createRoomsController } from './modules/rooms/rooms.controller.js';
import { createRoomsRouter } from './modules/rooms/rooms.routes.js';
import { createReservationsService } from './modules/reservations/reservations.service.js';
import { createReservationsController } from './modules/reservations/reservations.controller.js';
import { createReservationsRouter } from './modules/reservations/reservations.routes.js';

function createApp({ roomsRepository, reservationsRepository, now }) {
    const roomsService = createRoomsService({ roomsRepository });
    const reservationsService = createReservationsService({
        reservationsRepository,
        roomsRepository,
        now
    });

    const roomsController = createRoomsController({ roomsService });
    const reservationsController = createReservationsController({ reservationsService });

    const app = express();

    app.use(requestLogger);
    app.use(express.json());

    app.use('/api/rooms', createRoomsRouter({ roomsController }));
    app.use('/api/reservations', createReservationsRouter({ reservationsController }));

    // tymczasowy endpoint do demonstracji 500
    app.get('/api/debug/crash', () => {
        throw new Error('boom');
    });

    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
}

export { createApp };

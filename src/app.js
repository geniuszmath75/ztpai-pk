import express from 'express';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { createAuthService } from './modules/auth/auth.service.js';
import { createAuthController } from './modules/auth/auth.controller.js';
import { createAuthRouter } from './modules/auth/auth.routes.js';
import { createBuildingsService } from './modules/buildings/buildings.service.js';
import { createBuildingsController } from './modules/buildings/buildings.controller.js';
import { createBuildingsRouter } from './modules/buildings/buildings.routes.js';
import { createRoomsService } from './modules/rooms/rooms.service.js';
import { createRoomsController } from './modules/rooms/rooms.controller.js';
import { createRoomsRouter } from './modules/rooms/rooms.routes.js';
import { createReservationsService } from './modules/reservations/reservations.service.js';
import { createReservationsController } from './modules/reservations/reservations.controller.js';
import { createReservationsRouter } from './modules/reservations/reservations.routes.js';

function createApp({
    authRepository,
    buildingsRepository,
    roomsRepository,
    reservationsRepository,
    runInTransaction,
    now
}) {
    const authService = createAuthService({ authRepository });
    const buildingsService = createBuildingsService({
        buildingsRepository,
        roomsRepository
    });
    const roomsService = createRoomsService({ roomsRepository, buildingsRepository });
    const reservationsService = createReservationsService({
        reservationsRepository,
        roomsRepository,
        runInTransaction,
        now
    });

    const authController = createAuthController({ authService });
    const buildingsController = createBuildingsController({ buildingsService });
    const roomsController = createRoomsController({ roomsService });
    const reservationsController = createReservationsController({ reservationsService });

    const app = express();

    app.use(requestLogger);
    app.use(express.json());

    app.use('/api/auth', createAuthRouter({ authController }));
    app.use('/api/buildings', createBuildingsRouter({ buildingsController }));
    app.use('/api/rooms', createRoomsRouter({ roomsController }));
    app.use('/api/reservations', createReservationsRouter({ reservationsController }));

    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
}

export { createApp };

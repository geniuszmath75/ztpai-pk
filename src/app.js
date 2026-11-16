import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { createAuthenticate } from './middleware/authenticate.js';
import { openApiSpec } from './docs/openapi.js';
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
import { createAuditLogService } from './modules/audit/audit.service.js';
import { createAuditLogController } from './modules/audit/audit.controller.js';
import { createAuditLogRouter } from './modules/audit/audit.routes.js';
import { createEventBus } from './events/eventBus.js';
import { authorize } from './middleware/authorize.js';

function createApp({
    authRepository,
    buildingsRepository,
    roomsRepository,
    reservationsRepository,
    runInTransaction,
    jwtSecret,
    jwtExpiresIn,
    now,
    eventBus = createEventBus(),
    auditLogRepository
}) {
    const authService = createAuthService({ authRepository, jwtSecret, jwtExpiresIn });
    const authenticate = createAuthenticate({ jwtSecret });
    const buildingsService = createBuildingsService({
        buildingsRepository,
        roomsRepository
    });
    const roomsService = createRoomsService({ roomsRepository, buildingsRepository });
    const reservationsService = createReservationsService({
        reservationsRepository,
        roomsRepository,
        runInTransaction,
        eventBus,
        now
    });

    const authController = createAuthController({ authService });
    const buildingsController = createBuildingsController({ buildingsService });
    const roomsController = createRoomsController({ roomsService });
    const reservationsController = createReservationsController({ reservationsService });
    const auditLogService = auditLogRepository
        ? createAuditLogService({ auditLogRepository })
        : null;

    const app = express();

    app.use(requestLogger);
    app.use(express.json());

    // publiczne: /api/docs, register, login; reszta /api wymaga JWT
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
    app.use('/api/auth', createAuthRouter({ authController, authenticate }));
    app.use('/api/buildings', authenticate, createBuildingsRouter({ buildingsController }));
    app.use('/api/rooms', authenticate, createRoomsRouter({ roomsController }));
    app.use(
        '/api/reservations',
        authenticate,
        createReservationsRouter({ reservationsController })
    );
    if (auditLogService) {
        app.use(
            '/api/admin/audit-log',
            authenticate,
            authorize('ADMIN'),
            createAuditLogRouter({
                auditLogController: createAuditLogController({ auditLogService })
            })
        );
    }

    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
}

export { createApp };

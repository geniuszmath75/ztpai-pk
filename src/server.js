import { config } from './config/index.js';
import { createApp } from './app.js';
import { createKnex } from './db/knex.js';
import { createAuthRepository as createAuthRepositoryMemory } from './modules/auth/auth.repository.memory.js';
import { createAuthRepository as createAuthRepositoryKnex } from './modules/auth/auth.repository.knex.js';
import { createBuildingsRepository as createBuildingsRepositoryMemory } from './modules/buildings/buildings.repository.memory.js';
import { createBuildingsRepository as createBuildingsRepositoryKnex } from './modules/buildings/buildings.repository.knex.js';
import { createRoomsRepository as createRoomsRepositoryMemory } from './modules/rooms/rooms.repository.memory.js';
import { createRoomsRepository as createRoomsRepositoryKnex } from './modules/rooms/rooms.repository.knex.js';
import { createReservationsRepository as createReservationsRepositoryMemory } from './modules/reservations/reservations.repository.memory.js';
import { createReservationsRepository as createReservationsRepositoryKnex } from './modules/reservations/reservations.repository.knex.js';
import { createAuditLogRepository as createAuditLogRepositoryMemory } from './modules/audit/audit.repository.memory.js';
import { createAuditLogRepository as createAuditLogRepositoryKnex } from './modules/audit/audit.repository.knex.js';
import { createEventBus } from './events/eventBus.js';
import { registerEventListeners } from './events/registerListeners.js';

let authRepository;
let buildingsRepository;
let roomsRepository;
let reservationsRepository;
let auditLogRepository;
let runInTransaction;
let knex;
const eventBus = createEventBus();

if (config.storage === 'knex') {
    knex = createKnex();
    authRepository = createAuthRepositoryKnex(knex);
    buildingsRepository = createBuildingsRepositoryKnex(knex);
    roomsRepository = createRoomsRepositoryKnex(knex);
    reservationsRepository = createReservationsRepositoryKnex(knex);
    auditLogRepository = createAuditLogRepositoryKnex(knex);
    runInTransaction = (fn) =>
        knex.transaction(async (trx) =>
            fn({
                buildingsRepository: createBuildingsRepositoryKnex(trx),
                roomsRepository: createRoomsRepositoryKnex(trx),
                reservationsRepository: createReservationsRepositoryKnex(trx)
            })
        );
} else {
    authRepository = createAuthRepositoryMemory();
    buildingsRepository = createBuildingsRepositoryMemory();
    roomsRepository = createRoomsRepositoryMemory();
    reservationsRepository = createReservationsRepositoryMemory();
    auditLogRepository = createAuditLogRepositoryMemory();
    runInTransaction = async (fn) =>
        fn({ buildingsRepository, roomsRepository, reservationsRepository });
}

registerEventListeners({ eventBus, auditLogRepository, authRepository });

const app = createApp({
    authRepository,
    buildingsRepository,
    roomsRepository,
    reservationsRepository,
    runInTransaction,
    jwtSecret: config.jwtSecret,
    jwtExpiresIn: config.jwtExpiresIn,
    eventBus,
    auditLogRepository
});

const server = app.listen(config.port, (err) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(
        `Server running on http://localhost:${config.port} (storage=${config.storage})...`
    );
});

let shuttingDown = false;

async function shutdown(signal) {
    if (shuttingDown) {
        return;
    }
    shuttingDown = true;
    console.log(`Received ${signal}, shutting down...`);

    server.close(async (serverError) => {
        try {
            if (knex) {
                await knex.destroy();
                console.log('Database pool closed.');
            }
            if (serverError) {
                console.error(serverError);
                process.exitCode = 1;
            } else {
                console.log('Graceful shutdown complete.');
            }
        } catch (error) {
            console.error('Graceful shutdown failed.', error);
            process.exitCode = 1;
        }
    });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

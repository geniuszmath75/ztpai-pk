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

let authRepository;
let buildingsRepository;
let roomsRepository;
let reservationsRepository;
let runInTransaction;

if (config.storage === 'knex') {
    const knex = createKnex();
    authRepository = createAuthRepositoryKnex(knex);
    buildingsRepository = createBuildingsRepositoryKnex(knex);
    roomsRepository = createRoomsRepositoryKnex(knex);
    reservationsRepository = createReservationsRepositoryKnex(knex);
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
    runInTransaction = async (fn) =>
        fn({ buildingsRepository, roomsRepository, reservationsRepository });
}

const app = createApp({
    authRepository,
    buildingsRepository,
    roomsRepository,
    reservationsRepository,
    runInTransaction,
    jwtSecret: config.jwtSecret,
    jwtExpiresIn: config.jwtExpiresIn
});

// Express 5: callback dostaje też błąd listen (np. EADDRINUSE)
app.listen(config.port, (err) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(
        `Server running on http://localhost:${config.port} (storage=${config.storage})...`
    );
});

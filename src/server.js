import 'dotenv/config';
import { createApp } from './app.js';
import { createKnex } from './db/knex.js';
import { createBuildingsRepository as createBuildingsRepositoryMemory } from './modules/buildings/buildings.repository.memory.js';
import { createBuildingsRepository as createBuildingsRepositoryKnex } from './modules/buildings/buildings.repository.knex.js';
import { createRoomsRepository as createRoomsRepositoryMemory } from './modules/rooms/rooms.repository.memory.js';
import { createRoomsRepository as createRoomsRepositoryKnex } from './modules/rooms/rooms.repository.knex.js';
import { createReservationsRepository as createReservationsRepositoryMemory } from './modules/reservations/reservations.repository.memory.js';
import { createReservationsRepository as createReservationsRepositoryKnex } from './modules/reservations/reservations.repository.knex.js';

const PORT = 3000;
// wybór implementacji wyłącznie tutaj: knex | memory
const STORAGE = process.env.STORAGE || 'knex';

let buildingsRepository;
let roomsRepository;
let reservationsRepository;
let runInTransaction;

if (STORAGE === 'knex') {
    const knex = createKnex();
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
    buildingsRepository = createBuildingsRepositoryMemory();
    roomsRepository = createRoomsRepositoryMemory();
    reservationsRepository = createReservationsRepositoryMemory();
    runInTransaction = async (fn) =>
        fn({ buildingsRepository, roomsRepository, reservationsRepository });
}

const app = createApp({
    buildingsRepository,
    roomsRepository,
    reservationsRepository,
    runInTransaction
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT} (storage=${STORAGE})...`);
});

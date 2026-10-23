import { createApp } from './app.js';
import { createRoomsRepository } from './modules/rooms/rooms.repository.memory.js';
import { createReservationsRepository } from './modules/reservations/reservations.repository.memory.js';

const PORT = 3000;

const app = createApp({
    roomsRepository: createRoomsRepository(),
    reservationsRepository: createReservationsRepository()
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}...`);
});

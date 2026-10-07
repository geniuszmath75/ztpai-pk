import express from 'express';

const app = express();

app.use(express.json());

const rooms = [
    { id: 1, name: 'A101', capacity: 30 },
    { id: 2, name: 'B202', capacity: 16 },
    { id: 3, name: 'C303', capacity: 50 },
    { id: 4, name: 'D404', capacity: 8 }
];

const reservations = [];
let nextReservationId = 1;

app.get('/api/rooms', (req, res) => {
    res.json(rooms);
});

app.get('/api/rooms/:id', (req, res) => {
    const roomId = Number(req.params.id);
    const room = rooms.find(r => r.id === roomId);

    if (!room) {
        return res.status(404).json({ message: 'Room not found' });
    }

    res.json(room);
});

app.post('/api/reservations', (req, res) => {
    const { roomId, reservedBy, participants, date } = req.body;

    if (roomId === undefined || !reservedBy || participants === undefined || !date) {
        return res.status(400).json({ message: 'Invalid request body' });
    }

    const roomIdNumber = Number(roomId);
    const participantsNumber = Number(participants);

    if (!Number.isInteger(roomIdNumber) || !Number.isFinite(participantsNumber) || participantsNumber <= 0) {
        return res.status(400).json({ message: 'Invalid request body' });
    }

    const room = rooms.find(r => r.id === roomIdNumber);
    if (!room) {
        return res.status(404).json({ message: 'Room not found' });
    }

    if (participantsNumber > room.capacity) {
        return res.status(409).json({ message: 'Room capacity exceeded' });
    }

    const reservation = {
        id: nextReservationId++,
        roomId: roomIdNumber,
        reservedBy: String(reservedBy),
        participants: participantsNumber,
        date: String(date),
        status: 'CONFIRMED'
    };

    reservations.push(reservation);
    res.status(201).json(reservation);
});

app.get('/api/reservations', (req, res) => {
    const roomIdParam = req.query.roomId;
    if (roomIdParam === undefined) {
        return res.json(reservations);
    }

    const roomIdNumber = Number(roomIdParam);
    if (!Number.isInteger(roomIdNumber)) {
        return res.json([]);
    }

    const filtered = reservations.filter(r => r.roomId === roomIdNumber);
    res.json(filtered);
});

app.patch('/api/reservations/:id/cancel', (req, res) => {
    const reservationId = Number(req.params.id);
    const reservation = reservations.find(r => r.id === reservationId);

    if (!reservation) {
        return res.status(404).json({ message: 'Reservation not found' });
    }

    reservation.status = 'CANCELLED';
    res.json(reservation);
});

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000...");
});
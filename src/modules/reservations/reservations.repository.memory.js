function createReservationsRepository() {
    // Seed: rezerwacja już rozpoczęta (do testu anulowania)
    const items = [
        {
            id: 1,
            roomId: 1,
            reservedBy: 'Seed User',
            participants: 10,
            startTime: '2020-06-01T10:00:00.000Z',
            endTime: '2020-06-01T12:00:00.000Z',
            status: 'CONFIRMED',
            createdAt: '2020-05-20T08:00:00.000Z',
            cancelledAt: null,
            internalNote: 'seed: already started'
        }
    ];

    let nextId = 2;

    return {
        async findAll() {
            return items;
        },

        async findById(id) {
            return items.find((item) => item.id === id) ?? null;
        },

        async findConfirmedByRoomId(roomId) {
            return items.filter(
                (item) => item.roomId === roomId && item.status === 'CONFIRMED'
            );
        },

        async create(data) {
            const reservation = {
                id: nextId++,
                ...data
            };
            items.push(reservation);
            return reservation;
        },

        async save(reservation) {
            const index = items.findIndex((item) => item.id === reservation.id);
            if (index === -1) {
                return null;
            }
            items[index] = reservation;
            return items[index];
        }
    };
}

export { createReservationsRepository };

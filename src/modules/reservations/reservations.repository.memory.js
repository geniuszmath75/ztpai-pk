const roomsById = {
    1: { id: 1, name: 'A101', building: { id: 1, name: 'Budynek A' } },
    2: { id: 2, name: 'B202', building: { id: 1, name: 'Budynek A' } },
    3: { id: 3, name: 'C303', building: { id: 1, name: 'Budynek A' } },
    4: { id: 4, name: 'D404', building: { id: 2, name: 'Budynek B' } }
};

function withDetails(item) {
    return {
        id: item.id,
        reservedBy: item.reservedBy,
        participants: item.participants,
        startTime: item.startTime,
        endTime: item.endTime,
        status: item.status,
        createdAt: item.createdAt,
        cancelledAt: item.cancelledAt,
        room: roomsById[item.roomId]
    };
}

function createReservationsRepository() {
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

        async findAllWithDetails(roomId) {
            let list = items;
            if (roomId !== undefined) {
                list = items.filter((item) => item.roomId === roomId);
            }
            return list.map(withDetails);
        },

        async findById(id) {
            return items.find((item) => item.id === id) ?? null;
        },

        async findByIdWithDetails(id) {
            const item = items.find((i) => i.id === id);
            return item ? withDetails(item) : null;
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

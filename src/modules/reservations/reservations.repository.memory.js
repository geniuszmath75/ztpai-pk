const roomsById = {
    1: { id: 1, name: 'A101', building: { id: 1, name: 'Budynek A' } },
    2: { id: 2, name: 'B202', building: { id: 1, name: 'Budynek A' } },
    3: { id: 3, name: 'C303', building: { id: 1, name: 'Budynek A' } },
    4: { id: 4, name: 'D404', building: { id: 2, name: 'Budynek B' } }
};

const usersById = {
    1: { id: 1, email: 'seed.user@seed.local' }
};

function withDetails(item) {
    return {
        id: item.id,
        roomId: item.roomId,
        userId: item.userId,
        user: usersById[item.userId] ?? { id: item.userId, email: 'unknown@example.com' },
        participants: item.participants,
        startTime: item.startTime,
        endTime: item.endTime,
        status: item.status,
        createdAt: item.createdAt,
        cancelledAt: item.cancelledAt,
        room: roomsById[item.roomId]
    };
}

function overlaps(aStart, aEnd, bStart, bEnd) {
    return aStart < bEnd && bStart < aEnd;
}

function createReservationsRepository() {
    const items = [
        {
            id: 1,
            roomId: 1,
            userId: 1,
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
            return items.map((item) => withDetails(item));
        },

        async findPage(filters) {
            const { roomId, buildingId, status, from, to, page, limit, sort } = filters;
            let list = [...items];

            if (roomId !== undefined) {
                list = list.filter((r) => r.roomId === roomId);
            }
            if (buildingId !== undefined) {
                list = list.filter((r) => roomsById[r.roomId]?.building?.id === buildingId);
            }
            if (status !== undefined) {
                list = list.filter((r) => r.status === status);
            }
            if (from !== undefined || to !== undefined) {
                const fromMs = from !== undefined ? new Date(from).getTime() : -Infinity;
                const toMs = to !== undefined ? new Date(to).getTime() : Infinity;
                list = list.filter((r) =>
                    overlaps(
                        new Date(r.startTime).getTime(),
                        new Date(r.endTime).getTime(),
                        fromMs,
                        toMs
                    )
                );
            }

            const field = sort.replace(/^-/, '');
            const dir = sort.startsWith('-') ? -1 : 1;
            const key =
                field === 'startTime'
                    ? 'startTime'
                    : field === 'createdAt'
                      ? 'createdAt'
                      : 'participants';
            list.sort((a, b) => {
                const av = key === 'participants' ? a.participants : new Date(a[key]).getTime();
                const bv = key === 'participants' ? b.participants : new Date(b[key]).getTime();
                if (av !== bv) {
                    return av < bv ? -dir : dir;
                }
                return a.id - b.id;
            });

            const total = list.length;
            const offset = (page - 1) * limit;
            const rows = list.slice(offset, offset + limit).map(withDetails);
            return { rows, total };
        },

        async findById(id) {
            const item = items.find((i) => i.id === id);
            return item ? withDetails(item) : null;
        },

        async findByIdWithDetails(id) {
            const item = items.find((i) => i.id === id);
            return item ? withDetails(item) : null;
        },

        async findConfirmedByRoomId(roomId) {
            return items
                .filter((item) => item.roomId === roomId && item.status === 'CONFIRMED')
                .map((item) => withDetails(item));
        },

        async create(data) {
            const reservation = {
                id: nextId++,
                ...data
            };
            items.push(reservation);
            usersById[data.userId] ??= {
                id: data.userId,
                email: `user${data.userId}@example.com`
            };
            return withDetails(reservation);
        },

        async save(reservation) {
            const index = items.findIndex((item) => item.id === reservation.id);
            if (index === -1) {
                return null;
            }
            items[index] = {
                id: reservation.id,
                roomId: reservation.roomId,
                userId: reservation.userId,
                participants: reservation.participants,
                startTime: reservation.startTime,
                endTime: reservation.endTime,
                status: reservation.status,
                createdAt: reservation.createdAt,
                cancelledAt: reservation.cancelledAt
            };
            return withDetails(items[index]);
        }
    };
}

export { createReservationsRepository };

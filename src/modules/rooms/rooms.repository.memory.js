const buildingsById = {
    1: { id: 1, name: 'Budynek A' },
    2: { id: 2, name: 'Budynek B' }
};

function createRoomsRepository() {
    const rooms = [
        { id: 1, buildingId: 1, name: 'A101', capacity: 30, createdAt: '2026-01-01T00:00:00.000Z' },
        { id: 2, buildingId: 1, name: 'B202', capacity: 16, createdAt: '2026-01-01T00:00:00.000Z' },
        { id: 3, buildingId: 1, name: 'C303', capacity: 50, createdAt: '2026-01-01T00:00:00.000Z' },
        { id: 4, buildingId: 2, name: 'D404', capacity: 8, createdAt: '2026-01-01T00:00:00.000Z' }
    ];
    let nextId = 5;

    return {
        async findAll() {
            return rooms;
        },

        async findById(id) {
            return rooms.find((room) => room.id === id) ?? null;
        },

        async findByIdForUpdate(id) {
            return rooms.find((room) => room.id === id) ?? null;
        },

        async findByIdWithBuilding(id) {
            const room = rooms.find((r) => r.id === id);
            if (!room) {
                return null;
            }
            const building = buildingsById[room.buildingId];
            return {
                id: room.id,
                name: room.name,
                capacity: room.capacity,
                building: building ? { id: building.id, name: building.name } : null
            };
        },

        async findByBuildingId(buildingId) {
            return rooms.filter((r) => r.buildingId === buildingId);
        },

        async create({ buildingId, name, capacity }) {
            if (rooms.some((r) => r.buildingId === buildingId && r.name === name)) {
                const err = new Error('duplicate');
                err.code = '23505';
                throw err;
            }
            const room = {
                id: nextId++,
                buildingId,
                name,
                capacity,
                createdAt: new Date().toISOString()
            };
            rooms.push(room);
            return room;
        }
    };
}

export { createRoomsRepository };

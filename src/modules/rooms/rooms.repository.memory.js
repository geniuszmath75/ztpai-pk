function createRoomsRepository() {
    const rooms = [
        { id: 1, name: 'A101', capacity: 30 },
        { id: 2, name: 'B202', capacity: 16 },
        { id: 3, name: 'C303', capacity: 50 },
        { id: 4, name: 'D404', capacity: 8 }
    ];

    return {
        async findAll() {
            return rooms;
        },

        async findById(id) {
            return rooms.find((room) => room.id === id) ?? null;
        }
    };
}

export { createRoomsRepository };

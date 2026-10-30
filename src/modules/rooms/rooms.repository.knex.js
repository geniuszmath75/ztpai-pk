function mapRoom(row) {
    return {
        id: row.id,
        buildingId: row.building_id,
        name: row.name,
        capacity: row.capacity,
        createdAt: new Date(row.created_at).toISOString()
    };
}

function mapRoomWithBuilding(row) {
    return {
        id: row.id,
        name: row.name,
        capacity: row.capacity,
        building: {
            id: row.b_id,
            name: row.b_name
        }
    };
}

function createRoomsRepository(knex) {
    return {
        async findAll() {
            const rows = await knex('rooms').select('*').orderBy('id');
            return rows.map(mapRoom);
        },

        async findById(id) {
            const row = await knex('rooms').where({ id }).first();
            return row ? mapRoom(row) : null;
        },

        // blokada wiersza sali — serializuje rezerwacje tej samej sali
        async findByIdForUpdate(id) {
            const row = await knex('rooms').where({ id }).forUpdate().first();
            return row ? mapRoom(row) : null;
        },

        // 1 JOIN — stała liczba zapytań
        async findByIdWithBuilding(id) {
            const row = await knex('rooms')
                .join('buildings', 'rooms.building_id', 'buildings.id')
                .where('rooms.id', id)
                .select(
                    'rooms.id',
                    'rooms.name',
                    'rooms.capacity',
                    'buildings.id as b_id',
                    'buildings.name as b_name'
                )
                .first();
            return row ? mapRoomWithBuilding(row) : null;
        },

        async findByBuildingId(buildingId) {
            const rows = await knex('rooms')
                .where({ building_id: buildingId })
                .select('*')
                .orderBy('id');
            return rows.map(mapRoom);
        },

        async create({ buildingId, name, capacity }) {
            const [row] = await knex('rooms')
                .insert({
                    building_id: buildingId,
                    name,
                    capacity
                })
                .returning('*');
            return mapRoom(row);
        }
    };
}

export { createRoomsRepository };

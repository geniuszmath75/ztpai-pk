function mapRoom(row) {
    return {
        id: row.id,
        buildingId: row.building_id,
        name: row.name,
        capacity: row.capacity,
        createdAt: new Date(row.created_at).toISOString()
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

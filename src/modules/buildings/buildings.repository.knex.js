function mapBuilding(row) {
    return {
        id: row.id,
        name: row.name,
        address: row.address,
        createdAt: new Date(row.created_at).toISOString(),
        ...(row.rooms_count !== undefined
            ? { roomsCount: Number(row.rooms_count) }
            : {})
    };
}

function createBuildingsRepository(knex) {
    return {
        // LEFT JOIN + GROUP BY — budynki bez sal mają roomsCount: 0
        async findAll() {
            const rows = await knex('buildings')
                .leftJoin('rooms', 'buildings.id', 'rooms.building_id')
                .select('buildings.id', 'buildings.name', 'buildings.address', 'buildings.created_at')
                .count('rooms.id as rooms_count')
                .groupBy('buildings.id', 'buildings.name', 'buildings.address', 'buildings.created_at')
                .orderBy('buildings.id');
            return rows.map(mapBuilding);
        },

        async findById(id) {
            const row = await knex('buildings').where({ id }).first();
            return row ? mapBuilding(row) : null;
        },

        async create({ name, address }) {
            const [row] = await knex('buildings')
                .insert({ name, address })
                .returning('*');
            return mapBuilding(row);
        }
    };
}

export { createBuildingsRepository };

function mapBuilding(row) {
    return {
        id: row.id,
        name: row.name,
        address: row.address,
        createdAt: new Date(row.created_at).toISOString()
    };
}

function createBuildingsRepository(knex) {
    return {
        async findAll() {
            const rows = await knex('buildings').select('*').orderBy('id');
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

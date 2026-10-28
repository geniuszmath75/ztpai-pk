function createBuildingsRepository() {
    const buildings = [
        { id: 1, name: 'Budynek A', address: 'ul. Warszawska 24, Kraków', createdAt: '2026-01-01T00:00:00.000Z' },
        { id: 2, name: 'Budynek B', address: 'ul. Warszawska 26, Kraków', createdAt: '2026-01-01T00:00:00.000Z' }
    ];
    let nextId = 3;

    return {
        async findAll() {
            return buildings;
        },

        async findById(id) {
            return buildings.find((b) => b.id === id) ?? null;
        },

        async create({ name, address }) {
            if (buildings.some((b) => b.name === name)) {
                const err = new Error('duplicate');
                err.code = '23505';
                throw err;
            }
            const building = {
                id: nextId++,
                name,
                address,
                createdAt: new Date().toISOString()
            };
            buildings.push(building);
            return building;
        }
    };
}

export { createBuildingsRepository };

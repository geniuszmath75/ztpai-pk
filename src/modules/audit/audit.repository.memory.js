function createAuditLogRepository() {
    const items = [];
    let nextId = 1;

    return {
        async create({ eventType, payload }) {
            const item = {
                id: nextId++,
                eventType,
                payload,
                createdAt: new Date().toISOString()
            };
            items.push(item);
            return { ...item };
        },

        async findPage({ page, limit, eventType }) {
            const filtered = items
                .filter((item) => eventType === undefined || item.eventType === eventType)
                .sort((a, b) => b.id - a.id);
            const offset = (page - 1) * limit;

            return {
                rows: filtered.slice(offset, offset + limit).map((item) => ({ ...item })),
                total: filtered.length
            };
        }
    };
}

export { createAuditLogRepository };

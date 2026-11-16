function mapAuditLog(row) {
    return {
        id: row.id,
        eventType: row.event_type,
        payload: row.payload,
        createdAt: new Date(row.created_at).toISOString()
    };
}

function createAuditLogRepository(knex) {
    return {
        async create({ eventType, payload }) {
            const [row] = await knex('audit_log')
                .insert({
                    event_type: eventType,
                    payload
                })
                .returning('*');
            return mapAuditLog(row);
        },

        async findPage({ page, limit, eventType }) {
            const baseQuery = () => {
                const query = knex('audit_log');
                if (eventType !== undefined) {
                    query.where({ event_type: eventType });
                }
                return query;
            };

            const countRow = await baseQuery().count('* as total').first();
            const rows = await baseQuery()
                .orderBy('created_at', 'desc')
                .orderBy('id', 'desc')
                .limit(limit)
                .offset((page - 1) * limit);

            return {
                rows: rows.map(mapAuditLog),
                total: Number(countRow.total)
            };
        }
    };
}

export { createAuditLogRepository };

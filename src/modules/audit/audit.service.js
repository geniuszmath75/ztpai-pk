function createAuditLogService({ auditLogRepository }) {
    async function list(query) {
        const { rows, total } = await auditLogRepository.findPage(query);
        return {
            data: rows,
            meta: {
                page: query.page,
                limit: query.limit,
                total,
                totalPages: query.limit > 0 ? Math.ceil(total / query.limit) : 0
            }
        };
    }

    return { list };
}

export { createAuditLogService };

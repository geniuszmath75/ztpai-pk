function createAuditLogController({ auditLogService }) {
    return {
        async list(req, res) {
            const result = await auditLogService.list(req.validated.query);
            res.json(result);
        }
    };
}

export { createAuditLogController };

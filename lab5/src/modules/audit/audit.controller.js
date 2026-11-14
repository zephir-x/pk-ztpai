function createAuditController(auditService) {
    return {
        async list(req, res) {
            const { items, meta } = await auditService.listAuditLog(req.validated.query);
            res.status(200).json({ data: items, meta });
        }
    };
}

module.exports = { createAuditController };

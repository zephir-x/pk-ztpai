const { z } = require("zod");

const listAuditLogQuery = z.object({
    eventType: z.string().trim().min(1).max(100).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
});

module.exports = { listAuditLogQuery };

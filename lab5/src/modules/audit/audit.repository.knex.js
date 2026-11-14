function toAuditEntry(row) {
    if (!row) return null;
    return {
        id: Number(row.id),
        eventType: row.event_type,
        payload: row.payload,
        createdAt: new Date(row.created_at).toISOString()
    };
}

// Repository querying paginated and filtered domain event entries from the audit_log table
function createKnexAuditLogRepository(db) {
    return {
        async list({ eventType, page = 1, limit = 20 } = {}) {
            const base = db("audit_log").modify(qb => {
                if (eventType) {
                    qb.where("event_type", eventType);
                }
            });

            const [rows, { count }] = await Promise.all([
                base.clone()
                    .orderBy("created_at", "desc")
                    .orderBy("id", "desc")
                    .limit(limit)
                    .offset((page - 1) * limit),
                base.clone().clearSelect().count({ count: "*" }).first()
            ]);

            return {
                items: rows.map(toAuditEntry),
                total: Number(count)
            };
        }
    };
}

module.exports = { createKnexAuditLogRepository };

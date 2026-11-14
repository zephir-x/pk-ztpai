// Service orchestrating paginated retrieval of audit log entries
function createAuditService({ runInTransaction }) {
    async function listAuditLog(filters = {}) {
        return runInTransaction(async ({ auditLog }) => {
            const page = filters.page || 1;
            const limit = filters.limit || 20;
            const { items, total } = await auditLog.list({
                eventType: filters.eventType,
                page,
                limit
            });

            return {
                items,
                meta: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        });
    }

    return { listAuditLog };
}

module.exports = { createAuditService };

// Registers domain event listeners for audit log persistence and administrative cancellation notifications
function registerAuditListeners(eventBus, db, usersRepository) {
    const saveAuditLog = async event => {
        await db("audit_log").insert({
            event_type: event.name,
            payload: event.payload,
            created_at: event.occurredAt
        });
    };

    const notifyOwnerOnAdminCancel = async event => {
        const { reservationId, roomId, userId, cancelledBy } = event.payload;
        if (cancelledBy !== userId) {
            const owner = usersRepository ? await usersRepository.findById(userId) : null;
            const ownerEmail = owner ? owner.email : `user-${userId}@example.com`;
            console.log(
                `[notification] to: ${ownerEmail} - Your reservation #${reservationId} (room #${roomId}) was cancelled by ADMIN (user #${cancelledBy})`
            );
        }
    };

    eventBus.subscribe("reservation.created", saveAuditLog);
    eventBus.subscribe("reservation.cancelled", saveAuditLog);
    eventBus.subscribe("reservation.cancelled", notifyOwnerOnAdminCancel);
}

module.exports = { registerAuditListeners };

// Map internal reservation model to public API response DTO (excludes internalNote)
function toReservationResponse(reservation) {
    return {
        id: reservation.id,
        room: reservation.room ? {
            id: reservation.room.id,
            name: reservation.room.name,
            building: reservation.room.building ? {
                id: reservation.room.building.id,
                name: reservation.room.building.name
            } : null
        } : null,
        user: reservation.user ? {
            id: reservation.user.id,
            email: reservation.user.email
        } : null,
        participants: reservation.participants,
        startTime: new Date(reservation.startTime).toISOString(),
        endTime: new Date(reservation.endTime).toISOString(),
        status: reservation.status,
        createdAt: new Date(reservation.createdAt).toISOString(),
        cancelledAt: reservation.cancelledAt
            ? new Date(reservation.cancelledAt).toISOString()
            : null
    };
}

module.exports = { toReservationResponse };

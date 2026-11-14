// Map internal room model to public API response DTO
function toRoomResponse(room) {
    return {
        id: room.id,
        name: room.name,
        capacity: room.capacity,
        building: room.building ? {
            id: room.building.id,
            name: room.building.name
        } : null
    };
}

module.exports = { toRoomResponse };

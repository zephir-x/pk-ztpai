// Map internal room model to public API response DTO
function toRoomResponse(room) {
    return {
        id: room.id,
        name: room.name,
        capacity: room.capacity
    };
}

module.exports = { toRoomResponse };

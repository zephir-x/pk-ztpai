const { toRoomResponse } = require("./rooms.mapper");

// Controller translating HTTP requests to rooms service calls and mapping DTOs
function createRoomsController(roomsService) {
    return {
        async list(req, res) {
            const rooms = await roomsService.listRooms();
            res.json(rooms.map(toRoomResponse));
        },

        async getById(req, res) {
            const room = await roomsService.getRoom(req.validated.params.id);
            res.json(toRoomResponse(room));
        }
    };
}

module.exports = { createRoomsController };

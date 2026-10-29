const { NotFoundError } = require("../../errors/AppError");

function createRoomsService({ runInTransaction }) {
    async function listRooms() {
        return runInTransaction(async ({ rooms }) => {
            return rooms.list();
        });
    }

    async function getRoom(id) {
        return runInTransaction(async ({ rooms }) => {
            const room = await rooms.findById(id);
            if (!room) {
                throw new NotFoundError("Room");
            }
            return room;
        });
    }

    async function createRoom(input) {
        return runInTransaction(async ({ buildings, rooms }) => {
            const building = await buildings.findById(input.buildingId);
            if (!building) {
                throw new NotFoundError("Building");
            }
            return rooms.create(input);
        });
    }

    return { listRooms, getRoom, createRoom };
}

module.exports = { createRoomsService };

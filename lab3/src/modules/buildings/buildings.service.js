const { NotFoundError } = require("../../errors/AppError");

function createBuildingsService({ runInTransaction }) {
    async function listBuildings() {
        return runInTransaction(async ({ buildings }) => {
            return buildings.list();
        });
    }

    async function getBuilding(id) {
        return runInTransaction(async ({ buildings }) => {
            const building = await buildings.findById(id);
            if (!building) {
                throw new NotFoundError("Building");
            }
            return building;
        });
    }

    async function createBuilding(input) {
        return runInTransaction(async ({ buildings }) => {
            return buildings.create(input);
        });
    }
    
    async function getBuildingRooms(id) {
        return runInTransaction(async ({ buildings, rooms }) => {
            const building = await buildings.findById(id);
            if (!building) {
                throw new NotFoundError("Building"); // returns 404 if the building does not exist
            }
            return rooms.list({ buildingId: id });   // will return [] if the building has no rooms
        });
    }

    return { listBuildings, getBuilding, createBuilding, getBuildingRooms };
}

module.exports = { createBuildingsService };

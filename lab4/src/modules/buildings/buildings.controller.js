const { toBuildingResponse } = require("./buildings.mapper");
const { toRoomResponse } = require("../rooms/rooms.mapper");

function createBuildingsController(buildingsService) {
    return {
        async list(req, res) {
            const buildings = await buildingsService.listBuildings();
            res.json(buildings.map(toBuildingResponse));
        },
        async getById(req, res) {
            const building = await buildingsService.getBuilding(req.validated.params.id);
            res.json(toBuildingResponse(building));
        },
        async create(req, res) {
            const building = await buildingsService.createBuilding(req.validated.body);
            res.status(201).location(`/api/buildings/${building.id}`).json(toBuildingResponse(building));
        },
        async getRooms(req, res) {
            const rooms = await buildingsService.getBuildingRooms(req.validated.params.id);
            res.json(rooms.map(toRoomResponse));
        }
    };
}
module.exports = { createBuildingsController };

const { z } = require("zod");

const idParams = z.object({
    id: z.coerce.number().int().positive()
});

const createRoomBody = z.object({
    buildingId: z.number().int().positive(),
    name: z.string().trim().min(1).max(100),
    capacity: z.number().int().positive()
}).strict();

module.exports = { idParams, createRoomBody };

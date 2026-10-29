const { z } = require("zod");

const idParams = z.object({
    id: z.coerce.number().int().positive()
});

const createBuildingBody = z.object({
    name: z.string().trim().min(3).max(100),
    address: z.string().trim().min(3).max(200)
}).strict();

module.exports = { idParams, createBuildingBody };

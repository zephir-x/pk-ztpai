const { z } = require("zod");

// Schema for validating room identifier in URL parameters
const idParams = z.object({
    id: z.coerce.number().int().positive()
});

module.exports = { idParams };

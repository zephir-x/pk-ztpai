const { z } = require("zod");

const registerBody = z.object({
    email: z.string().email().toLowerCase(),
    password: z.string()
        .min(10, "Password must have at least 10 characters")
        .max(72, "Password can have at most 72 characters")
}).strict();

const loginBody = z.object({
    email: z.string().email().toLowerCase(),
    password: z.string().min(1)
}).strict();

module.exports = { registerBody, loginBody };

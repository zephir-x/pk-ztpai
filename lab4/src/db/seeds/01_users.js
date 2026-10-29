const bcrypt = require("bcryptjs");

exports.seed = async function (knex) {
    // Truncate users table and restart sequences
    // CASCADE ensures related records (if any in future) are also removed
    await knex.raw("TRUNCATE users RESTART IDENTITY CASCADE");

    const passwordHash = await bcrypt.hash("admin-password-123", 12);

    await knex("users").insert({
        email: "admin@example.com",
        password_hash: passwordHash,
        role: "ADMIN"
    });
};

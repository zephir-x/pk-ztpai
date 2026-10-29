function createUsersRepository(db) {
    async function create(user) {
        const [newUser] = await db("users").insert({
            email: user.email,
            password_hash: user.passwordHash,
            role: user.role
        }).returning("*");

        return {
            id: newUser.id,
            email: newUser.email,
            passwordHash: newUser.password_hash,
            role: newUser.role,
            createdAt: newUser.created_at
        };
    }

    async function findByEmail(email) {
        const user = await db("users").where({ email }).first();
        if (!user) return null;

        return {
            id: user.id,
            email: user.email,
            passwordHash: user.password_hash,
            role: user.role,
            createdAt: user.created_at
        };
    }

    async function findById(id) {
        const user = await db("users").where({ id }).first();
        if (!user) return null;
        return {
            id: user.id, email: user.email,
            passwordHash: user.password_hash, role: user.role, createdAt: user.created_at
        };
    }

    return { create, findByEmail, findById };
}

module.exports = { createUsersRepository };

function toBuilding(row) {
    if (!row) return null;
    return {
        id: row.id,
        name: row.name,
        address: row.address,
        createdAt: row.created_at,
        roomsCount: row.rooms_count ? Number(row.rooms_count) : 0 // Ensure integer conversion
    };
}

function createKnexBuildingsRepository(db) {
    return {
        async list() {
            const rows = await db("buildings as b")
                .leftJoin("rooms as r", "r.building_id", "b.id")
                .select("b.id", "b.name", "b.address", "b.created_at")
                .count("r.id as rooms_count")
                .groupBy("b.id");
            return rows.map(toBuilding);
        },
        async findById(id) {
            const row = await db("buildings as b")
                .leftJoin("rooms as r", "r.building_id", "b.id")
                .where({ "b.id": id })
                .select("b.id", "b.name", "b.address", "b.created_at")
                .count("r.id as rooms_count")
                .groupBy("b.id")
                .first();
            return toBuilding(row);
        },
        async create(data) {
            const [createdId] = await db("buildings")
                .insert({ name: data.name, address: data.address })
                .returning("id");
            return this.findById(createdId.id);
        },
        async lockById(id) {
            await db("buildings").where({ id }).forUpdate().first();
        }
    };
}
module.exports = { createKnexBuildingsRepository };

// Mapper must now take the joined columns from the database and assemble a nested JSON
function toRoom(row) {
    if (!row) return null;
    return {
        id: row.id,
        name: row.name,
        capacity: row.capacity,
        building: {
            id: row.building_id,
            name: row.building_name
        }
    };
}

function createKnexRoomsRepository(db) {
    return {
        async list(query = {}) {
            const base = db("rooms as r")
                .join("buildings as b", "b.id", "r.building_id")
                .select(
                    "r.id",
                    "r.name",
                    "r.capacity",
                    "b.id as building_id",
                    "b.name as building_name"
                );

            if (query.buildingId) {
                base.where("r.building_id", query.buildingId);
            }

            const rows = await base;
            return rows.map(toRoom);
        },
        async findById(id) {
            const row = await db("rooms as r")
                .join("buildings as b", "b.id", "r.building_id")
                .where({ "r.id": id })
                .select(
                    "r.id",
                    "r.name",
                    "r.capacity",
                    "b.id as building_id",
                    "b.name as building_name"
                )
                .first();
            return toRoom(row);
        },
        async create(data) {
            // After creation, we need to fetch it WITH the JOIN to satisfy the return contract
            const [createdId] = await db("rooms")
                .insert({ building_id: data.buildingId, name: data.name, capacity: data.capacity })
                .returning("id");

            return this.findById(createdId.id);
        },
        async lockById(id) {
            await db("rooms").where({ id }).forUpdate().first();
        }
    };
}
module.exports = { createKnexRoomsRepository };

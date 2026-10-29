function toReservation(row) {
    if (!row) return null;
    return {
        id: row.id,
        reservedBy: row.reserved_by,
        participants: row.participants,
        startTime: row.start_time,
        endTime: row.end_time,
        status: row.status,
        cancelledAt: row.cancelled_at,
        createdAt: row.created_at,
        room: {
            id: row.room_id,
            name: row.room_name,
            building: {
                id: row.building_id,
                name: row.building_name
            }
        }
    };
}

const SORT_COLUMNS = {
    startTime: "res.start_time",
    createdAt: "res.created_at",
    participants: "res.participants"
};

function createKnexReservationsRepository(db) {
    const getBaseQuery = () => db("reservations as res")
        .join("rooms as r", "r.id", "res.room_id")
        .join("buildings as b", "b.id", "r.building_id")
        .select(
            "res.id", "res.reserved_by", "res.participants", "res.start_time",
            "res.end_time", "res.status", "res.cancelled_at", "res.created_at",
            "r.id as room_id", "r.name as room_name",
            "b.id as building_id", "b.name as building_name"
        );

    return {
        async list(query = {}) {
            const base = getBaseQuery().modify(qb => {
                if (query.roomId) qb.where("res.room_id", query.roomId);
                if (query.buildingId) qb.where("r.building_id", query.buildingId);
                if (query.status) qb.where("res.status", query.status);

                if (query.from) qb.where("res.end_time", ">", query.from);
                if (query.to) qb.where("res.start_time", "<", query.to);
            });

            // Ensure sort parameters have a fallback for internal service calls
            const sortParam = query.sort || "-startTime";
            const desc = sortParam.startsWith("-");
            const columnKey = desc ? sortParam.slice(1) : sortParam;
            const column = SORT_COLUMNS[columnKey];

            // Ensure pagination parameters have fallbacks for internal service calls
            const page = query.page || 1;
            const limit = query.limit || 100;

            const [rows, { count }] = await Promise.all([
                base.clone()
                    .orderBy(column, desc ? "desc" : "asc")
                    .orderBy("res.id", "asc")
                    .limit(limit)
                    .offset((page - 1) * limit),
                base.clone().clearSelect().count({ count: "*" }).first()
            ]);

            return {
                items: rows.map(toReservation),
                total: Number(count)
            };
        },
        async findById(id) {
            const row = await getBaseQuery().where({ "res.id": id }).first();
            return toReservation(row);
        },
        async create(data) {
            const [createdId] = await db("reservations")
                .insert({
                    room_id: data.roomId,
                    reserved_by: data.reservedBy,
                    participants: data.participants,
                    start_time: data.startTime,
                    end_time: data.endTime,
                    status: data.status
                })
                .returning("id");
            return this.findById(createdId.id);
        },
        async updateStatus(id, status, extraFields = {}) {
            const updateData = { status };
            if (extraFields.cancelledAt) updateData.cancelled_at = extraFields.cancelledAt;

            await db("reservations").where({ id }).update(updateData);
            return this.findById(id);
        }
    };
}
module.exports = { createKnexReservationsRepository };

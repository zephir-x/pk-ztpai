exports.up = async function(knex) {
    await knex.schema.createTable("buildings", table => {
        table.increments("id").primary();
        table.string("name").notNullable().unique();
        table.string("address").notNullable();
        table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    });

    await knex.schema.createTable("rooms", table => {
        table.increments("id").primary();
        table.integer("building_id").notNullable().references("id").inTable("buildings").onDelete("CASCADE");
        table.string("name").notNullable();
        table.integer("capacity").notNullable();
        table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());

        table.unique(["building_id", "name"]);
    });

    await knex.raw(`ALTER TABLE rooms ADD CONSTRAINT rooms_capacity_check CHECK (capacity > 0)`);

    await knex.schema.createTable("reservations", table => {
        table.increments("id").primary();
        table.integer("room_id").notNullable().references("id").inTable("rooms").onDelete("CASCADE");
        table.string("reserved_by").notNullable();
        table.integer("participants").notNullable();
        table.timestamp("start_time", { useTz: true }).notNullable();
        table.timestamp("end_time", { useTz: true }).notNullable();
        table.string("status").notNullable().defaultTo("CONFIRMED");
        table.timestamp("cancelled_at", { useTz: true });
        table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());

        table.index(["room_id", "start_time", "end_time"]);
    });

    await knex.raw(`ALTER TABLE reservations ADD CONSTRAINT reservations_dates_check CHECK (end_time > start_time)`);
    await knex.raw(`ALTER TABLE reservations ADD CONSTRAINT reservations_status_check CHECK (status IN ('CONFIRMED', 'CANCELLED'))`);
};

exports.down = async function(knex) {
    await knex.schema.dropTable("reservations");
    await knex.schema.dropTable("rooms");
    await knex.schema.dropTable("buildings");
};

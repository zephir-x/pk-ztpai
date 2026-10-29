exports.up = async function (knex) {
    // 1. Adding a new column that allows NULL values
    await knex.schema.alterTable("reservations", table => {
        table.integer("user_id").references("id").inTable("users").onDelete("SET NULL");
    });

    // 2. Backfill: Assigning existing reservations to the ADMIN user (ID = 1)
    await knex("reservations").update({ user_id: 1 });

    // 3. Applying a NOT NULL constraint to a new column and removing the old one
    await knex.schema.alterTable("reservations", table => {
        table.integer("user_id").notNullable().alter();
        table.dropColumn("reserved_by");
    });
};

exports.down = async function (knex) {
    // Revert process
    await knex.schema.alterTable("reservations", table => {
        table.string("reserved_by", 100);
    });

    // Dummy data for rollback
    await knex("reservations").update({ reserved_by: "Legacy User" });

    await knex.schema.alterTable("reservations", table => {
        table.string("reserved_by", 100).notNullable().alter();
        table.dropColumn("user_id");
    });
};

const config = require("./src/config");

module.exports = {
    client: "pg",
    connection: config.DATABASE_URL,
    migrations: { directory: "./src/db/migrations" },
    seeds: { directory: "./src/db/seeds" }
};

try {
    process.loadEnvFile();
} catch (err) {
    // Suppress error if .env file is missing
}

module.exports = {
    client: "pg",
    connection: process.env.DATABASE_URL,
    migrations: { directory: "./src/db/migrations" },
    seeds: { directory: "./src/db/seeds" }
};

const { Client } = require("pg");

// Utility script ensuring the isolated test database exists before running integration tests
async function ensureTestDb() {
    const testUrl = new URL(process.env.TEST_DATABASE_URL ?? "postgres://postgres:postgres@localhost:5434/roombooking_test");
    const dbName = testUrl.pathname.slice(1);
    testUrl.pathname = "/postgres";

    const client = new Client({ connectionString: testUrl.toString() });
    await client.connect();
    try {
        const res = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
        if (res.rowCount === 0) {
            await client.query(`CREATE DATABASE "${dbName}"`);
            console.log(`Created test database: ${dbName}`);
        } else {
            console.log(`Test database already exists: ${dbName}`);
        }
    } finally {
        await client.end();
    }
}

if (require.main === module) {
    ensureTestDb().catch(err => {
        console.error("Failed to ensure test database:", err.message);
        process.exit(1);
    });
}

module.exports = { ensureTestDb };

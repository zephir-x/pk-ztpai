// Pre-populate environment variables before any module imports src/config/index.js
// Ensures integration tests always target the dedicated test database instead of development DB
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? "postgres://postgres:postgres@localhost:5434/roombooking_test";
process.env.JWT_SECRET = "test-secret-test-secret-test-secret-123";
process.env.JWT_EXPIRES_IN = "15m";

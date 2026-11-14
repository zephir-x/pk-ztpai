# Room Booking API (Lab 5)

![CI](https://github.com/zephir-x/pk-ztpai/actions/workflows/ci-lab5.yml/badge.svg)

REST API for managing buildings, rooms, and reservations with JWT authentication, RBAC, domain events, audit logging, and automated tests.

## Quick Start (Docker Compose)

1. Clone the repository and navigate to `lab5`:
   ```bash
   git clone https://github.com/zephir-x/pk-ztpai.git
   cd pk-ztpai/lab5
   ```

2. Create the `.env` file from the template:
   ```bash
   cp .env.example .env
   ```

3. Build and start the containers (database + API with automatic migrations):
   ```bash
   docker compose up --build -d
   ```

4. (Optional) Seed initial data and the `ADMIN` account (`admin@example.com` / `admin-password-123`):
   ```bash
   docker compose exec api npx knex seed:run
   ```

5. Access the application:
   - **API Base URL:** `http://localhost:3000/api`
   - **Swagger UI Documentation:** `http://localhost:3000/api/docs`

6. Stop the application gracefully:
   ```bash
   docker compose down
   ```

## Running Tests Locally

Ensure the PostgreSQL container is running (`docker compose up -d db`), create the test database, and execute the test suite:

```bash
npm ci
node scripts/ensure-test-db.js
npm test
```

- Unit tests only (no database required): `npm run test:unit`
- Integration tests only: `npm run test:integration`

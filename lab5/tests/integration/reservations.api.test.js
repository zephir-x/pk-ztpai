const request = require("supertest");
const config = require("../../src/config");
const db = require("../../src/db/knex");
const { createApp } = require("../../src/app");
const { createKnexUnitOfWork } = require("../../src/modules/unitOfWork.knex");
const { createUsersRepository } = require("../../src/modules/auth/users.repository.knex");
const { createEventBus } = require("../../src/events/eventBus");
const { registerAuditListeners } = require("../../src/events/auditListeners");

const NOW = new Date("2026-11-15T10:00:00.000Z");

const usersRepository = createUsersRepository(db);
const eventBus = createEventBus();
registerAuditListeners(eventBus, db, usersRepository);

const app = createApp({
    uow: createKnexUnitOfWork(db),
    config,
    usersRepository,
    eventBus,
    now: () => NOW
});

async function registerAndLogin(email) {
    await request(app)
        .post("/api/auth/register")
        .send({ email, password: "password-123" })
        .expect(201);

    const res = await request(app)
        .post("/api/auth/login")
        .send({ email, password: "password-123" })
        .expect(200);

    return res.body.accessToken;
}

beforeAll(async () => {
    await db.migrate.latest();
});

beforeEach(async () => {
    await db.raw("TRUNCATE audit_log, reservations, rooms, buildings, users RESTART IDENTITY CASCADE");

    await db("buildings").insert([
        { name: "Main Building", address: "Warszawska 24, Krakow" }
    ]);

    await db("rooms").insert([
        { building_id: 1, name: "A101", capacity: 20 },
        { building_id: 1, name: "B202", capacity: 15 }
    ]);
});

afterAll(async () => {
    await db.destroy();
});

describe("Room Booking API - Integration Tests", () => {
    test("1. registers user, logs in, and returns profile via GET /api/auth/me", async () => {
        const regRes = await request(app)
            .post("/api/auth/register")
            .send({ email: "jan.kowalski@example.com", password: "password-123" });

        expect(regRes.status).toBe(201);
        expect(regRes.body).toMatchObject({
            email: "jan.kowalski@example.com",
            role: "USER"
        });
        expect(regRes.body.passwordHash).toBeUndefined();

        const loginRes = await request(app)
            .post("/api/auth/login")
            .send({ email: "jan.kowalski@example.com", password: "password-123" });

        expect(loginRes.status).toBe(200);
        expect(typeof loginRes.body.accessToken).toBe("string");

        const meRes = await request(app)
            .get("/api/auth/me")
            .set("Authorization", `Bearer ${loginRes.body.accessToken}`);

        expect(meRes.status).toBe(200);
        expect(meRes.body).toMatchObject({
            id: regRes.body.id,
            email: "jan.kowalski@example.com",
            role: "USER"
        });
    });

    test("2. POST /api/reservations returns 201, Location header, and persists record in database", async () => {
        const token = await registerAndLogin("jan@example.com");

        const res = await request(app)
            .post("/api/reservations")
            .set("Authorization", `Bearer ${token}`)
            .send({
                roomId: 1,
                participants: 10,
                startTime: "2026-11-16T10:00:00.000Z",
                endTime: "2026-11-16T12:00:00.000Z"
            });

        expect(res.status).toBe(201);
        expect(res.headers.location).toBe(`/api/reservations/${res.body.id}`);
        expect(res.body).toMatchObject({
            status: "CONFIRMED",
            participants: 10,
            room: { id: 1, name: "A101" }
        });

        const row = await db("reservations").where({ id: res.body.id }).first();
        expect(row).toBeDefined();
        expect(row.room_id).toBe(1);
        expect(row.participants).toBe(10);
        expect(row.status).toBe("CONFIRMED");
    });

    test("3. returns 400 with field details for invalid request body", async () => {
        const token = await registerAndLogin("jan@example.com");

        const res = await request(app)
            .post("/api/reservations")
            .set("Authorization", `Bearer ${token}`)
            .send({
                roomId: 1,
                participants: -5,
                startTime: "2026-11-16T10:00:00.000Z",
                endTime: "2026-11-16T12:00:00.000Z"
            });

        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe("VALIDATION_ERROR");
        expect(res.body.error.details).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    location: "body",
                    field: "participants"
                })
            ])
        );
    });

    test("4. returns 401 UNAUTHORIZED when Authorization token is missing", async () => {
        const res = await request(app).get("/api/reservations");

        expect(res.status).toBe(401);
        expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    test("5. returns 403 FORBIDDEN when USER attempts to create a room", async () => {
        const userToken = await registerAndLogin("user@example.com");

        const res = await request(app)
            .post("/api/rooms")
            .set("Authorization", `Bearer ${userToken}`)
            .send({
                buildingId: 1,
                name: "Secret Room",
                capacity: 50
            });

        expect(res.status).toBe(403);
        expect(res.body.error.code).toBe("FORBIDDEN");
    });

    test("6. returns 404 NOT_FOUND when USER attempts to fetch another user's reservation", async () => {
        const janToken = await registerAndLogin("jan@example.com");
        const annaToken = await registerAndLogin("anna@example.com");

        const { body: created } = await request(app)
            .post("/api/reservations")
            .set("Authorization", `Bearer ${janToken}`)
            .send({
                roomId: 1,
                participants: 5,
                startTime: "2026-11-16T10:00:00.000Z",
                endTime: "2026-11-16T12:00:00.000Z"
            })
            .expect(201);

        const res = await request(app)
            .get(`/api/reservations/${created.id}`)
            .set("Authorization", `Bearer ${annaToken}`);

        expect(res.status).toBe(404);
        expect(res.body.error.code).toBe("NOT_FOUND");
    });

    test("7. returns 409 ROOM_ALREADY_BOOKED for overlapping reservation", async () => {
        const token = await registerAndLogin("jan@example.com");

        await request(app)
            .post("/api/reservations")
            .set("Authorization", `Bearer ${token}`)
            .send({
                roomId: 1,
                participants: 5,
                startTime: "2026-11-16T10:00:00.000Z",
                endTime: "2026-11-16T12:00:00.000Z"
            })
            .expect(201);

        const overlapRes = await request(app)
            .post("/api/reservations")
            .set("Authorization", `Bearer ${token}`)
            .send({
                roomId: 1,
                participants: 5,
                startTime: "2026-11-16T11:00:00.000Z",
                endTime: "2026-11-16T13:00:00.000Z"
            });

        expect(overlapRes.status).toBe(409);
        expect(overlapRes.body.error.code).toBe("ROOM_ALREADY_BOOKED");
    });

    test("8. returns paginated results with accurate meta.total and data length when limit < total records", async () => {
        const token = await registerAndLogin("jan@example.com");

        const slots = [
            ["2026-11-16T08:00:00.000Z", "2026-11-16T09:00:00.000Z"],
            ["2026-11-16T10:00:00.000Z", "2026-11-16T11:00:00.000Z"],
            ["2026-11-16T12:00:00.000Z", "2026-11-16T13:00:00.000Z"]
        ];

        for (const [startTime, endTime] of slots) {
            await request(app)
                .post("/api/reservations")
                .set("Authorization", `Bearer ${token}`)
                .send({ roomId: 1, participants: 5, startTime, endTime })
                .expect(201);
        }

        const res = await request(app)
            .get("/api/reservations?page=1&limit=2")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(2);
        expect(res.body.meta).toMatchObject({
            page: 1,
            limit: 2,
            total: 3,
            totalPages: 2
        });
    });
});

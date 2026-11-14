exports.seed = async function (knex) {
    // Clearing tables while maintaining script idempotency
    await knex.raw("TRUNCATE buildings, rooms, reservations RESTART IDENTITY CASCADE");

    await knex("buildings").insert([
        { name: "Budynek A", address: "ul. Warszawska 24, Kraków" },
        { name: "Budynek B", address: "ul. Opolska 10, Kraków" }
    ]);

    await knex("rooms").insert([
        { building_id: 1, name: "101", capacity: 30 },
        { building_id: 1, name: "102", capacity: 50 },
        { building_id: 2, name: "201", capacity: 15 },
        { building_id: 2, name: "202", capacity: 20 },
        { building_id: 2, name: "203", capacity: 100 }
    ]);

    // Past-dated data for testing the "reservation started" rule
    const pastStart = new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString();
    const pastEnd = new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString();

    await knex("reservations").insert([
        { room_id: 1, user_id: 1, participants: 20, start_time: "2026-11-10T10:00:00Z", end_time: "2026-11-10T12:00:00Z", status: "CONFIRMED" },
        { room_id: 2, user_id: 1, participants: 40, start_time: "2026-11-11T09:00:00Z", end_time: "2026-11-11T11:00:00Z", status: "CONFIRMED" },
        { room_id: 3, user_id: 1, participants: 10, start_time: pastStart, end_time: pastEnd, status: "CONFIRMED" },
        { room_id: 4, user_id: 1, participants: 5, start_time: "2026-12-01T15:00:00Z", end_time: "2026-12-01T16:00:00Z", status: "CANCELLED", cancelled_at: new Date().toISOString() },
        { room_id: 5, user_id: 1, participants: 80, start_time: "2026-12-05T10:00:00Z", end_time: "2026-12-05T18:00:00Z", status: "CONFIRMED" }
    ]);
};

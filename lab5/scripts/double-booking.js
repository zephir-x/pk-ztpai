const knex = require("../src/db/knex");

async function start() {
    const payload = {
        roomId: 1,
        reservedBy: "Race Tester",
        participants: 10,
        startTime: "2027-08-08T10:00:00Z",
        endTime: "2027-08-08T12:00:00Z"
    };

    console.log("Sending 10 parallel reservation requests...");
    const requests = Array.from({ length: 10 }).map(async (_, index) => {
        await new Promise(resolve => setTimeout(resolve, index * 50));
        return fetch("http://localhost:3000/api/reservations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
    });

    const responses = await Promise.all(requests);
    const statuses = responses.map(r => r.status);
    console.log("Status codes received:", statuses);

    const { count } = await knex("reservations")
        .where({ room_id: 1, status: "CONFIRMED" })
        .andWhere("start_time", "2027-08-08T10:00:00Z")
        .count({ count: "*" })
        .first();

    console.log(`CONFIRMED reservations in DB for this slot: ${Number(count)}`);
    process.exit(0);
}

start();

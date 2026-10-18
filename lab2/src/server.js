const { createApp } = require("./app");
const { createInMemoryRoomsRepository } = require("./modules/rooms/rooms.repository.memory");
const { createInMemoryReservationsRepository } = require("./modules/reservations/reservations.repository.memory");

const port = 3000;

// Composition root: initialize concrete in-memory repositories
const roomsRepository = createInMemoryRoomsRepository();
const reservationsRepository = createInMemoryReservationsRepository();

const app = createApp({
    roomsRepository,
    reservationsRepository
});

// Server bootstrap
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

const express = require("express");
const app = express();
const port = 3000;

// Add middleware to parse JSON bodies
app.use(express.json());

// In-memory data storage for rooms
const rooms = [
    { id: 1, name: "A101", capacity: 30 },
    { id: 2, name: "B202", capacity: 15 },
    { id: 3, name: "C303", capacity: 50 },
    { id: 4, name: "D404", capacity: 120 }
];

// In-memory data storage for reservations
const reservations = [];

// Retrieve all available rooms
app.get("/api/rooms", (req, res) => {
    res.json(rooms);
});

// Retrieve a specific room by its identifier
app.get("/api/rooms/:id", (req, res) => {
    const id = Number(req.params.id);
    const room = rooms.find(r => r.id === id);

    if (!room) {
        return res.status(404).json({
            message: "Room not found"
        });
    }

    res.json(room);
});

// Create a new reservation with validation and business rules
app.post("/api/reservations", (req, res) => {
    const { roomId, reservedBy, participants, date } = req.body;

    // Validate incoming data structure and requirements
    if (!roomId || !reservedBy || typeof participants !== 'number' || participants <= 0 || !date) {
        return res.status(400).json({
            message: "Invalid input data"
        });
    }

    const room = rooms.find(r => r.id === roomId);

    // Validate room existence
    if (!room) {
        return res.status(404).json({
            message: "Room not found"
        });
    }

    // Business rule: Check if room capacity is exceeded
    if (participants > room.capacity) {
        return res.status(409).json({
            message: "Room capacity exceeded"
        });
    }

    // Create and store the reservation
    const newReservation = {
        id: reservations.length + 1,
        roomId: roomId,
        reservedBy: reservedBy,
        participants: participants,
        date: date,
        status: "CONFIRMED"
    };

    reservations.push(newReservation);

    res.status(201).json(newReservation);
});

// Retrieve all reservations or filter by roomId query parameter
app.get("/api/reservations", (req, res) => {
    const roomId = req.query.roomId;

    if (!roomId) {
        return res.json(reservations);
    }

    const parsedRoomId = Number(roomId);
    const filteredReservations = reservations.filter(r => r.roomId === parsedRoomId);

    res.json(filteredReservations);
});

// Cancel a specific reservation by updating its status to CANCELLED
app.patch("/api/reservations/:id/cancel", (req, res) => {
    const id = Number(req.params.id);
    const reservation = reservations.find(r => r.id === id);

    if (!reservation) {
        return res.status(404).json({ message: "Reservation not found" });
    }

    if (reservation.status !== "CANCELLED") {
        reservation.status = "CANCELLED";
    }

    res.status(200).json(reservation);
});

// Server bootstrap
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

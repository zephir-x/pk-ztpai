const express = require("express");
const app = express();
const port = 3000;

// In-memory data storage for rooms
const rooms = [
    { id: 1, name: "A101", capacity: 30 },
    { id: 2, name: "B202", capacity: 15 },
    { id: 3, name: "C303", capacity: 50 },
    { id: 4, name: "D404", capacity: 120 }
];

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

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

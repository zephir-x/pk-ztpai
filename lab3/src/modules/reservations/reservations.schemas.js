const { z } = require("zod");

// Schema for validating reservation identifier in URL parameters
const idParams = z.object({
    id: z.coerce.number().int().positive()
});

// Schema for validating complex query parameters in GET /api/reservations
const listReservationsQuery = z.object({
    roomId: z.coerce.number().int().positive().optional(),
    buildingId: z.coerce.number().int().positive().optional(),
    status: z.enum(["CONFIRMED", "CANCELLED"]).optional(),
    from: z.iso.datetime({ offset: true }).optional(),
    to: z.iso.datetime({ offset: true }).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z.enum(["startTime", "-startTime", "createdAt", "-createdAt", "participants", "-participants"]).default("-startTime")
}).refine(data => {
    // Validate that 'from' is strictly before 'to' if both are provided
    if (data.from && data.to) {
        return new Date(data.from) < new Date(data.to);
    }
    return true;
}, {
    message: "from parameter must be earlier than to parameter",
    path: ["from"]
});

// Schema for validating reservation creation payload with strict field enforcement
const createReservationBody = z.object({
    roomId: z.number().int().positive(),
    reservedBy: z.string().trim().min(3).max(100),
    participants: z.number().int().positive(),
    startTime: z.iso.datetime({ offset: true }),
    endTime: z.iso.datetime({ offset: true })
}).strict();

module.exports = {
    idParams,
    listReservationsQuery,
    createReservationBody
};

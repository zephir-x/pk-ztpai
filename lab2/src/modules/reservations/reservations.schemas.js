const { z } = require("zod");

// Schema for validating reservation identifier in URL parameters
const idParams = z.object({
    id: z.coerce.number().int().positive()
});

// Schema for validating optional roomId filter in query parameters
const listReservationsQuery = z.object({
    roomId: z.coerce.number().int().positive().optional()
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

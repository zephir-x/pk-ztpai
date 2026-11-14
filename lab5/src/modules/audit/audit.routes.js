const { Router } = require("express");
const authorize = require("../../middleware/authorize");
const validate = require("../../middleware/validate");
const { listAuditLogQuery } = require("./audit.schemas");

// Router exposing administrative audit log inspection strictly for ADMIN role
function createAuditRouter(controller) {
    const router = Router();

    router.get("/audit-log", authorize("ADMIN"), validate({ query: listAuditLogQuery }), controller.list);

    return router;
}

module.exports = { createAuditRouter };

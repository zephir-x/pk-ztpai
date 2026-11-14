const { ValidationError } = require("../errors/AppError");

// Universal middleware validating request params, query, and body against Zod schemas
function validate(schemas) {
    return (req, res, next) => {
        const validated = {};
        const details = [];

        for (const part of ["params", "query", "body"]) {
            if (!schemas[part]) continue;

            const result = schemas[part].safeParse(req[part] ?? {});
            if (!result.success) {
                for (const issue of result.error.issues) {
                    details.push({
                        location: part,
                        field: issue.path.join("."),
                        message: issue.message
                    });
                }
            } else {
                validated[part] = result.data;
            }
        }

        if (details.length > 0) {
            return next(new ValidationError(details));
        }

        req.validated = validated;
        next();
    };
}

module.exports = validate;

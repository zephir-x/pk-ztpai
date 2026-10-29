const { createApp } = require("./app");
const db = require("./db/knex");
const { createKnexUnitOfWork } = require("./modules/unitOfWork.knex");

const PORT = process.env.PORT || 3000;

// Pass the Knex Unit of Work to the application factory
const app = createApp({ uow: createKnexUnitOfWork(db) });

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

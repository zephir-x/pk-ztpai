const config = require("./config");
const { createApp } = require("./app");
const db = require("./db/knex");
const { createKnexUnitOfWork } = require("./modules/unitOfWork.knex");
const { createUsersRepository } = require("./modules/auth/users.repository.knex");

const app = createApp({
    uow: createKnexUnitOfWork(db),
    config,
    usersRepository: createUsersRepository(db)
});

app.listen(config.PORT, () => {
    console.log(`Server running on http://localhost:${config.PORT} in ${config.NODE_ENV} mode`);
});

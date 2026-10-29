const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { ConflictError, UnauthorizedError, NotFoundError } = require("../../errors/AppError");

const BCRYPT_ROUNDS = 12;

function createAuthService({ usersRepository, jwtSecret, jwtExpiresIn }) {
    async function register({ email, password }) {
        const existing = await usersRepository.findByEmail(email);
        if (existing) {
            throw new ConflictError("Email already registered", "EMAIL_TAKEN");
        }
        const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
        return usersRepository.create({ email, passwordHash, role: "USER" });
    }

    async function login({ email, password }) {
        const user = await usersRepository.findByEmail(email);

        // The execution time of the comparison is hidden through Boolean verification
        const passwordOk = user ? await bcrypt.compare(password, user.passwordHash) : false;

        // Generic error message for an incorrect email or password (protection against user enumeration)
        if (!user || !passwordOk) {
            throw new UnauthorizedError("Invalid email or password");
        }

        const accessToken = jwt.sign(
            { role: user.role },
            jwtSecret,
            { subject: String(user.id), expiresIn: jwtExpiresIn, algorithm: "HS256" }
        );

        return { accessToken, tokenType: "Bearer", expiresIn: jwtExpiresIn };
    }

    async function getProfile(userId) {
        const user = await usersRepository.findById(userId);
        if (!user) throw new NotFoundError("User");
        return user;
    }

    return { register, login, getProfile };
}

module.exports = { createAuthService };

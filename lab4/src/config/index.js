const { z } = require("zod");

try {
    process.loadEnvFile();
} catch {
    // Intentionally suppressed
    // In production environments, environment variables are often provided externally
}

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().default(3000),
    DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),
    JWT_SECRET: z.string().min(32, "JWT_SECRET must have at least 32 characters"),
    JWT_EXPIRES_IN: z.string().default("15m")
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
    console.error("Invalid environment configuration:");
    for (const issue of result.error.issues) {
        console.error(`${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
}

module.exports = Object.freeze(result.data);

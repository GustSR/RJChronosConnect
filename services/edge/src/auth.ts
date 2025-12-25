import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { config } from "./config";

const databaseUrl =
  process.env.BETTER_AUTH_DATABASE_URL ?? process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "BETTER_AUTH_DATABASE_URL or DATABASE_URL must be set for Better Auth."
  );
}

const pool = new Pool({
  connectionString: databaseUrl
});

export const auth = betterAuth({
  database: pool,
  basePath: config.betterAuthBasePath,
  ...(config.betterAuthBaseUrl ? { baseURL: config.betterAuthBaseUrl } : {}),
  ...(config.betterAuthTrustedOrigins
    ? { trustedOrigins: config.betterAuthTrustedOrigins }
    : {}),
  emailAndPassword: {
    enabled: true
  }
});

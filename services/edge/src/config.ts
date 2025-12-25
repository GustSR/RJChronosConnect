const getEnv = (key: string, fallback?: string) =>
  process.env[key] ?? fallback;

const parseList = (value?: string) => {
  if (!value) return undefined;
  const items = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length ? items : undefined;
};

const parseBool = (value?: string) => value === "1" || value === "true";

export const config = {
  host: getEnv("EDGE_HOST", "0.0.0.0"),
  port: Number(getEnv("EDGE_PORT", "8081")),
  backendInternalUrl: getEnv("BACKEND_INTERNAL_URL", "http://backend:8000"),
  genieacsUiInternalUrl: getEnv(
    "GENIEACS_UI_INTERNAL_URL",
    "http://genieacs:3000"
  ),
  frontendDevUrl: getEnv("FRONTEND_DEV_URL"),
  frontendDistDir: getEnv("FRONTEND_DIST_DIR", "public"),
  legacyAuthProxyEnabled: parseBool(getEnv("EDGE_LEGACY_AUTH_PROXY_ENABLED")),
  legacyAuthProxyHeader: getEnv("EDGE_LEGACY_AUTH_PROXY_HEADER", "x-legacy-auth"),
  legacyAuthProxyToken: getEnv("EDGE_LEGACY_AUTH_PROXY_TOKEN"),
  betterAuthBasePath: getEnv("BETTER_AUTH_BASE_PATH", "/api/auth"),
  betterAuthBaseUrl: getEnv("BETTER_AUTH_BASE_URL") ?? getEnv("BETTER_AUTH_URL"),
  betterAuthTrustedOrigins: parseList(
    getEnv("BETTER_AUTH_TRUSTED_ORIGINS")
  )
};

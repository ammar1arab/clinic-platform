/** Shared auth constants — safe to import from both server (proxy) and client. */
export const AUTH_COOKIE_NAME = 'token';

/** Cookie lifetime in seconds (7 days). Mirrors the JWT we persist client-side. */
export const AUTH_TOKEN_MAX_AGE = 60 * 60 * 24 * 7;

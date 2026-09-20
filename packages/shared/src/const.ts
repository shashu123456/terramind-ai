/** Shared application constants. */

export const APP_NAME = "TerraMind AI";
export const APP_VERSION = "1.0.0";
export const REPO_URL = "https://github.com/terramind-ai/terramind-ai";

export const COOKIE_NAME = "terramind_session";
export const ONE_MINUTE_MS = 60_000;
export const ONE_HOUR_MS = 60 * ONE_MINUTE_MS;
export const ONE_DAY_MS = 24 * ONE_HOUR_MS;
export const ONE_YEAR_MS = 365 * ONE_DAY_MS;

export const AXIOS_TIMEOUT_MS = 30_000;

export const UNAUTHED_ERR_MSG = "Please login (10001)";
export const NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";
export const DB_UNAVAILABLE_ERR_MSG = "Database is not available";
export const NOT_FOUND_ERR_MSG = "Resource not found";
export const VALIDATION_ERR_MSG = "Invalid input";

export const SESSION_COOKIE_MAX_AGE = ONE_YEAR_MS;

/** Budget cap for portfolio optimisation (INR). */
export const MAX_BUDGET_INR = 500_000_000;

/** Default modelling horizon used when a scenario does not specify one. */
export const DEFAULT_HORIZON_YEARS = 5;

/** Model/version strings surfaced to the UI so every figure is traceable. */
export const MODEL_VERSION = "campus-interventions-v1.0";
export const FACTOR_VERSION = "india-demo-factors-v1.0";
# Changelog

## PENDING - CI TO FILL TIMESTAMP
- Enforced mandatory environment validation across server startup and halted legacy localhost defaults for ports and API URLs.
- Required explicit MinIO region configuration to unblock bucket and CORS health checks.
- Updated env templates with explicit MinIO presign expiry to satisfy the stricter runtime checks.
- Ensured Vite and server config both read the repository-root `.env` so Docker Compose remains the single source of truth.
- Prioritized `VITE_API_URL` for the frontend API client so production deployments can point at non-localhost backends.
- Replaced `HealthStatus` default props with inline parameter defaults to align with upcoming React changes and silence dev console warnings.
- Normalized server CORS handling to accept comma-separated `CORS_ALLOWED_ORIGINS`, including wildcard and null origins, with coverage in Node test cases.
- Ensured the Vite bootstrap script tag disables Cloudflare Rocket Loader via `data-cfasync="false"` to avoid credential mismatches during preload.

## 2025-10-24 05:58:23 IST
- Added a shared module loader utility and refactored server imports to remove brittle absolute paths for error handling.

## 2025-10-24 05:54:28 IST
- Normalized MinIO configuration parsing to ignore blank environment values and restore the default region fallback.

## 2025-10-24 06:08:04 IST
- Synced container and runtime ports with SERVER_PORT and CLIENT_PORT environment variables across config, client dev server, and Docker Compose.

## 2025-10-24 06:11:30 IST
- Updated client API base URL resolution to honour `.env` port settings by propagating SERVER_PORT/CLIENT_PORT into Vite runtime variables, with docs refreshed in `.env.example`.

## 2025-10-24 06:23:02 IST
- Synced server CORS configuration with `.env` by deriving allowed origins from CLIENT_PORT and CORS_ALLOWED_ORIGINS.

## 2025-10-24 06:28:10 IST
- Added `EMAIL_SMTP_*` fallbacks in server config so existing environment files power SMTP integration without 500 errors.

## 2025-10-24 06:32:39 IST
- Wired Vite dev/preview hosts to `CLIENT_ALLOWED_HOSTS` so custom domains avoid production host blocks and documented the env.

## 2025-10-24 05:51:49 IST
- Updated MinIO integration to robustly locate shared error handling utilities across local and container environments.
- Adjusted server Docker build to include the shared module by switching to the monorepo root context.

## 2025-10-24 05:36:47 IST
- Bootstrap client and server applications with health, email test, and MinIO upload capabilities.
- Added Docker Compose workflow, shared error handling, and Prisma health schema.
- Introduced Tailwind-powered dashboard UI for monitoring dependencies.

# Changelog

## 2025-10-24 13:00 IST
- Align backend logging dependencies so `pino-http` and the shared logger use the same Pino version, fixing runtime crashes during request logging.

## 2025-10-24 12:35 IST
- Enforced 1:1 adoption of `.env` variables across server configuration, request routing, and integrations.
- Updated Vite build pipeline and API client to require the shared `VITE_API_URL`, `CLIENT_PORT`, and `CLIENT_ALLOWED_HOSTS`.
- Refresh documentation, Docker Compose, and tests to reflect the synchronized environment contract.
- Fixed server Docker image build to include shared modules and upgraded `pino-http` for compatibility with the logging stack.
- Updated Vite tooling to defer all port binding to `CLIENT_PORT` so Docker and local runs honor `.env` values.

## 2025-10-24 12:07 IST
- Implemented health monitoring platform with Express APIs for database, MinIO, and SMTP verification.
- Added React health dashboard with email test form and MinIO upload workflow.
- Provisioned Docker Compose setup and environment template for client and server services.

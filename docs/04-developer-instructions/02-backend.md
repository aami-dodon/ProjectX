# Backend Module Development Guide

This guide documents how to extend the Express + Prisma server that powers Project X. Follow these practices to keep new API functionality consistent and observable.

## 1. Kickstarting API Work

1. Install dependencies and launch the dev server from the `server/` workspace:
   ```bash
   cd server
   npm install
   npm run dev
   ```
   The dev task boots Express with nodemon and reads configuration from the repository root `.env`. Update `.env.example` whenever you introduce a new variable so other developers can run the stack without guesswork.
2. Generate the Prisma client when you update the schema:
   ```bash
   npx prisma generate
   ```
   The command runs automatically on `npm install`, but execute it manually after editing `prisma/schema.prisma` to keep type-safe database bindings current.
3. Run quality gates before you open a pull request:
   ```bash
   npm test            # Jest + Supertest coverage for your modules
   npm run lint        # ESLint with the shared Node.js rules
   npm run format:check
   ```
   These commands mirror the CI pipeline defined for the server workspace.

## 2. Module Anatomy

Every feature under `server/src/modules` follows the same layering pattern. Use existing modules such as `health` and `email` as blueprints.

- **`*.router.js`** – declares the Express routes and attaches middleware such as validators or authentication guards.
- **`*.controller.js`** – orchestrates request/response logic, delegating to services and translating domain errors into HTTP responses.
- **`*.service.js`** – hosts business logic and composes repositories, integrations, and utilities.
- **`*.repository.js`** – (optional) encapsulates Prisma access for the module. Keep SQL concerns out of services and controllers.

When you create a new module:

1. Scaffold the files above under `server/src/modules/<feature>/`.
2. Register the router inside `server/src/app.js` so the routes are reachable under the `/api` namespace. Follow the existing `health`, `email`, and `upload` imports when wiring your router.

## 3. Request Lifecycle & Middleware

- Perform lightweight validation as close to the router as possible. Simple checks can live in the controller (see the upload controller for an example); complex workflows should add dedicated middleware inside the module.
- Wrap asynchronous controllers in `try/catch` blocks and forward unexpected errors with `next(error)` so the global handler in `server/src/middleware/errorHandler.js` can format the response.
- Preserve observability by passing each request through the logger middleware defined in `server/src/middleware/request-logger.js`. Avoid early `res.end` calls that would bypass logging and metrics.
- Surface domain-specific errors with `ApplicationError` instances from `server/src/utils/errors.js`. Set `statusCode`, `code`, and `details` to keep responses uniform.

## 4. Database & Integrations

- Interact with PostgreSQL via the singleton Prisma client in `server/src/integrations/prisma.js`. Instantiate repositories per module to keep query logic cohesive.
- Define new tables or columns in `server/prisma/schema.prisma` and generate migrations using:
  ```bash
  npx prisma migrate dev --name <change-name>
  ```
  Commit the generated migration files alongside schema updates.
- Use the MinIO helper in `server/src/integrations/minio.js` for object storage interactions. Apply the existing validation patterns in `upload` module routers to enforce MIME type and size limits.
- Send transactional email through the transport exported from `server/src/integrations/mailer.js`. Compose templates in the relevant module service so they stay close to the triggering workflow.

## 5. Configuration & Environment

- Validate configuration inside `server/src/config/env.js`. Add new settings to the Zod schema, provide sensible defaults for local development, and document them in `.env.example`.
- The authentication stack expects JWT secrets, token TTLs, and reset/verification expiry windows. Define `AUTH_ACCESS_TOKEN_SECRET`, `AUTH_REFRESH_TOKEN_SECRET`, their TTL values, and the reset/verification timers (`AUTH_PASSWORD_RESET_TOKEN_TTL_MINUTES`, `AUTH_EMAIL_VERIFICATION_TOKEN_TTL_MINUTES`) in the environment so the auth service can hash, rotate, and expire credentials consistently. Mirror these keys in `.env.example` and keep the schema in sync.
- Keep `VITE_API_URL` in sync with the Express public base URL whenever you expose new routes that the frontend consumes.
- Treat secrets carefully—never commit real credentials. Use descriptive placeholder values in `.env.example` to indicate expected formats (URLs, tokens, etc.).

## 6. Testing Strategy

- Co-locate Jest unit tests under `__tests__` directories adjacent to the code they exercise (e.g. `server/src/modules/<feature>/__tests__`) when you need module-level coverage.
- Use Supertest to cover HTTP contracts. Mount routers against the Express app from `server/src/app.js` to ensure middleware and error handling behaviour remains intact.
- Keep end-to-end route suites in `server/tests` (mirroring the existing health/email/upload specs) so the Jest `testPathPattern=tests` configuration picks them up automatically.
- Stub third-party integrations (SMTP, MinIO) with Jest mocks. If a scenario requires multiple modules, extract shared fixtures into `server/tests/support` (create the folder when needed) so suites stay DRY.

## 7. Deployment Considerations

- Confirm migrations have been generated and applied before deploying new backend features.
- Ensure long-running jobs or scheduled tasks run idempotently—reuse the same logging conventions as request handlers via `createLogger('<module>')` from `server/src/utils/logger.js`.
- Document any manual operational steps (new cron jobs, bucket policies, SMTP credentials) in `docs/` so operators can repeat them during rollouts.

By following this backend guide, you’ll ship server features that are observable, well-tested, and consistent with the rest of Project X.

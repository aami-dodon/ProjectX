# Health module reuse guide

The health module centralises operational diagnostics for the platform. It aggregates system metrics,
checks core integrations, and surfaces the `/api/health` endpoint for uptime probes.

## Public surfaces

- **Router (`health.router.js`)** – exposes the unauthenticated `/api/health` endpoint documented with
  OpenAPI annotations so monitoring systems can consume it without auth headers.
- **Controller (`health.controller.js`)** – coordinates request-scoped context (server start time,
  configured CORS options) before delegating to the service.
- **Service (`health.service.js`)** – collects runtime metrics (CPU, memory, disk, process usage),
  checks database connectivity via the repository, and evaluates the configured CORS policy.
- **Repository (`health.repository.js`)** – provides database connectivity checks using Prisma.

## Typical reuse scenarios

1. **Embedding diagnostics in another module** – import `getHealthStatus` from the service when you
   need a health snapshot as part of a composite admin response.
2. **Adding additional integration checks** – extend the service to call out to new repository or
   integration helpers, then merge the resulting status into the existing `determineOverallStatus`
   pipeline.
3. **Customising CORS evaluation** – pass explicit `corsOptions` to `getHealthStatus` if a router uses
   a bespoke CORS configuration and you want the health payload to reflect it.

## Integration requirements

- Ensure `server/src/app.js` supplies the shared `serverStartTime` and CORS configuration when the
  controller is invoked. Any new middleware that changes these values should update the wiring here.
- Database connectivity depends on the Prisma client exported from
  `server/src/integrations/prisma.js`. Keep credentials in `.env` synchronised with `env.DATABASE_URL`.
- The disk snapshot executes `df -Pk /`, which requires the runtime to ship standard UNIX utilities.

## Extending the module safely

- Derive new health statuses (`operational`, `degraded`, `outage`) using the `determineOverallStatus`
  helper so responses remain consistent.
- Normalise numeric metrics via the existing helpers (`formatPercentage`, `toFiniteOrNull`) when adding
  new fields to avoid leaking `NaN` values to clients.
- Document any new response properties by extending the OpenAPI schema in `health.router.js`.

## Testing tips

- Mock `health.repository.checkDatabaseConnection` and `execSync` when unit-testing the service to
  avoid hitting live dependencies.
- Use integration tests with supertest to assert response shapes remain backwards compatible when new
  diagnostics are introduced.

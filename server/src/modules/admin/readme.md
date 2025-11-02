# Admin module reuse guide

The admin module exposes user management APIs that let operators search accounts,
review metrics, and update profile or status details. It is exported via
`server/src/modules/admin/index.js`, which currently surfaces the Express router
bound to `/api/admin`.

## Public surfaces

- **Router (`admin.router.js`)** – applies authentication and the `requireRoles('admin')`
  guard before wiring `/api/admin/users` listing and `/api/admin/users/:userId`
  update endpoints.
- **Controller (`admin.controller.js`)** – adapts HTTP requests into service calls
  and returns structured JSON payloads or forwards errors to the global handler.
- **Service (`admin.service.js`)** – aggregates account search filters, computes
  dashboard metrics, normalises updates, and writes audit events for admin-driven
  changes.
- **Repository (`admin.repository.js`)** – wraps Prisma queries for retrieving and
  updating auth users with role assignment relationships.

### `/api/admin/users` query capabilities

The listing endpoint supports fully server-side pagination, searching, sorting,
and filtering. The following query parameters are accepted:

- `page` (number, default `1`) – 1-based page index.
- `pageSize` (number, default `25`) – page size, capped at 100.
- `search` – case-insensitive match across name and email.
- `status` – one of `ACTIVE`, `PENDING_VERIFICATION`, `SUSPENDED`, `INVITED`.
- `filter=role:<roleId>` – restricts results to users assigned a specific role.
- `sort=<field>:<direction>` – supports `name`, `email`, `status`,
  `lastLoginAt`, and defaults to `createdAt:desc`.

Responses now include `pagination.page`, `pagination.pageSize`, and
`totalCount` alongside the existing `limit`/`offset` properties for
backwards compatibility. Dashboard metrics (`metrics`) are computed using the
global user base rather than the current page of results.

Import the module through the shared alias:

```js
const { router: adminRouter } = require('@/modules/admin');
```

## Typical reuse scenarios

1. **Mounting admin routes** – register `adminRouter` under an `/api/admin`
   scope inside `server/src/app.js` (already configured) or another Express
   composition to expose the management endpoints.
2. **Fetching administrative user data** – call `getAdminUsers({ search, status, limit, offset })`
   from the service when another module needs the combined listings, pagination
   metadata, and metrics payload used by the dashboard.
3. **Applying privileged updates** – reuse `updateUserAccount({ userId, updates, actorId })`
   when you need to synchronise status, email, verification, or profile
   adjustments from workflows outside the default router handlers.

## Integration requirements

- Ensure the auth middleware exports (`authenticateRequest`, `requireRoles`) stay
  available so the router continues to enforce admin-only access.
- Keep Prisma schema changes for `authUser` and related role tables mirrored in
  the repository helpers before services depend on them.
- Maintain audit logging in `logAuthEvent` to preserve traceability whenever
  admin actors edit accounts.

## Extending the module safely

- Update OpenAPI annotations in `admin.router.js` when adding or modifying
  endpoints so the API specification reflects the surface area.
- Expand `VALID_STATUSES` and the normalisation helpers in the service when new
  lifecycle states are introduced.
- Preserve the metrics builders when altering payloads to avoid breaking the
  dashboard charts that consume them.

## Testing tips

- Mock Prisma calls in unit tests to isolate service logic for filtering,
  validation, and metrics aggregation.
- Exercise router paths with supertest to confirm only authenticated admins can
  reach the endpoints and that validation errors propagate correctly.
- Cover audit logging branches by verifying `logAuthEvent` is invoked during
  update flows when an `actorId` is supplied.

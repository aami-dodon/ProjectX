# Auth module reuse guide

The auth module provides the API surface for user onboarding, login, token rotation, and
role-aware authorization middleware. It is exported through `server/src/modules/auth/index.js`,
which exposes the Express router plus the reusable middleware helpers.

## Public surfaces

- **Router (`auth.router.js`)** – mounts under `/api/auth` and wires the controller handlers for
  registration, login, token refresh, logout, password reset, and email verification flows.
- **Controller (`auth.controller.js`)** – bridges HTTP request DTOs into the service layer and returns
  uniform JSON envelopes for success and error cases.
- **Service (`auth.service.js`)** – owns the business logic for issuing credentials, rotating tokens,
  and orchestrating email notifications via the mailer integration.
- **Repository (`auth.repository.js`)** – encapsulates all Prisma interactions, including user
  persistence, session storage, and role assignment tables.
- **Middleware (`auth.middleware.js`)** – exposes `authenticateRequest` (JWT validation + session
  lookup) and `requireRoles` (role-based guard) so other modules can protect their routes.

Import the module via the alias configured in `server/src/index.js`:

```js
const { router: authRouter, authenticateRequest, requireRoles } = require('@/modules/auth');
```

## Typical reuse scenarios

1. **Protecting new API routes** – compose `authenticateRequest` and optionally
   `requireRoles(['admin'])` in any router to enforce signed-in access.
2. **Issuing credentials inside another service** – call the exported service helpers (e.g.
   `registerUser`, `loginUser`, `refreshSession`) if you need to bootstrap users programmatically.
3. **Extending onboarding flows** – add validation or metadata in the service layer so the router
   and controllers stay HTTP-focused.

## Integration requirements

- Environment secrets referenced in the service (`AUTH_ACCESS_TOKEN_SECRET`,
  `AUTH_REFRESH_TOKEN_TTL_SECONDS`, `AUTH_PASSWORD_SALT_ROUNDS`, `APP_BASE_URL`, etc.) must remain
  in sync with `server/src/config/env.js`.
- Email notifications rely on the shared mailer integration. Keep the templates in `emails/`
  updated when introducing new tokens or copy changes.
- Session revocation and role assignments are stored via the repository helpers. Ensure any new
  Prisma schema fields are surfaced through these helpers before the service consumes them.

## Extending the module safely

- Add new OpenAPI annotations alongside controller routes so documentation stays current.
- Keep hashing helpers (`hashValue`, `issueRefreshToken`) inside the service to avoid duplicating
  security-sensitive code.
- When introducing new roles, extend `ensureDefaultRole` or add repository helpers that mirror the
  existing role assignment patterns.

## Testing tips

- Unit-test service behaviours by mocking the repository and mailer exports.
- Exercise middleware guards through supertest suites that mount the router with fixture tokens.
- Add regression tests for token expiry logic whenever TTL configuration changes.

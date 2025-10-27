# Coding and Development Guidelines

## Mission & Product Focus

Write Code:
- Easy to maintain
- Easy to make Changes
- Easy to Migrate for Future Enhancement (AWS ECS with Aurora PostgreSQL and S3)
- Respects Monorepo structure

## Tech Stack & Module Ownership

- **Language:** 100% JavaScript across frontend, backend, tests, and tooling (no TypeScript anywhere).
- **Frontend:** React (Vite toolchain) with React Router, TailwindCSS + shadcn/ui, Lucide icons, and Tiptap editor for evidence authoring/upload.
  - For UI reference and guidelines you must comply with: `reference/ui-reference.md`
- **Backend:** Express on Node.js organized by feature modules:
  - `Auth`, `Governance Engine`, `Frameworks`, `Evidence`, `Notifications`, `Tasks`
- **Data:** Prisma ORM with **externally hosted PostgreSQL** (configuration in `.env`); evidence binaries stored in **externally hosted MinIO** (configuration in `.env`) via presigned URLs.
- **Shared Logic:** Place cross-cutting utilities (e.g., date/time utils, schema validators, shared middleware) in `shared/`; keep third-party integrations in `server/src/integrations/`.

## Vite Configuration & Build

- Use Vite for fast frontend development and optimized production builds.
- Environment variables for Vite must be prefixed with `VITE_` to be exposed to the client.
- Keep Vite config minimal and document any custom plugins or build optimizations in `/docs`.
- Build output should go to `client/dist` and be served statically in production.

## React Router & Routing

- Organize routes in `client/src/routes/` with clear, nested structure.
- Use route-based code splitting for performance optimization.
- Protected routes must check authentication status and redirect to login if unauthorized.
- Keep route definitions centralized in a single router configuration file.

## Axios Configuration

- Configure a base Axios instance in `client/src/lib/client.js` with:
  - Base URL pointing to the backend API
  - Request interceptors to automatically inject JWT tokens from storage
  - Response interceptors to handle errors globally and trigger centralized error handling
- Use consistent API client methods across the frontend (avoid ad-hoc fetch calls).

## Email & Notifications (Nodemailer)

- Store email templates in `server/src/templates/email/`.
- Email templates must use branded design following the same design tokens and styling conventions defined in `reference/ui-reference.md`.
- Build email HTML templates using inline styles derived from global CSS tokens (colors, typography, spacing) to ensure brand consistency.
- Use the same color palette (`--primary`, `--secondary`, `--muted`, etc.) and typography scale as defined in the UI design system.
- Email templates should be responsive and work across major email clients.
- Use consistent template structure with variables for dynamic content.
- Send notifications for: user registration, password reset, task assignments, compliance deadlines.
- Configure SMTP settings via `.env` variables.
- Log all email send attempts (success and failure) for audit purposes.

## Security & Data Handling

- Enforce least privilege via Casbin policies and JWT-based session flows.
- Secure all service-to-service traffic with HTTPS/TLS and scoped credentials.
- Manage secrets via `.env` files (never commit to version control).
- Validate and track evidence uploads with SHA-256 checksums, audit logs, and linkage back to PostgreSQL metadata.

## Authentication & Authorization (JWT + Casbin)

### JWT Strategy
- Use access tokens with **15-minute expiration** and refresh tokens with **7-day expiration**.
- Store access tokens in memory (React state) and refresh tokens in **httpOnly cookies** for security.
- Implement token refresh logic in Axios interceptors to automatically renew expired tokens.
- Tokens must be revoked on logout by maintaining a blacklist in Redis or PostgreSQL.

### Casbin Policies
- Store all Casbin policies in `server/src/policies/` as `.csv` files.
- Define roles (e.g., Admin, Auditor, User) and their permissions clearly.
- Use role-based access control (RBAC) model with resource-level permissions.
- Test all policy changes locally before deploying to production.
- Document policy changes in `/docs/policy-changelog.md`.

## CORS Configuration

- Configure CORS middleware in Express to allow requests only from:
  - Local development: `http://localhost:5173` (Vite default)
  - Production: Specific production domain(s) defined in `.env`
- Allow credentials (cookies) with `credentials: true`.
- Permitted headers: `Authorization`, `Content-Type`, `X-Request-ID`.
- Permitted methods: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`.

## Development Workflow

- Follow JavaScript linting/formatting conventions (ESLint, Prettier) and keep `.env.example` configuration templates current.
- Preserve API contracts with OpenAPI specs and JSON schemas stored in `/api/v1/docs`. Backend developers must add OpenAPI annotations/decorators directly in code (e.g., JSDoc, decorators, inline comments) wherever a new API is created or an existing API is updated.
- Coordinate breaking changes through versioning, migration notes, and announcements in the #dev-updates channel.

## Environment Variables & Configuration (dotenv)

- All configuration must be stored in `.env` files (never hardcode credentials or URLs).
- Maintain an up-to-date `.env.example` file with all required variables and descriptions.
- Required variables include:
  - `DATABASE_URL` - PostgreSQL connection string
  - `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY` - MinIO configuration
  - `JWT_SECRET`, `JWT_REFRESH_SECRET` - JWT signing keys
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` - Email configuration
  - `CORS_ORIGIN` - Allowed frontend origin(s)
  - `VITE_API_BASE_URL` - Backend API URL for frontend
- Use different `.env` files for local, staging, and production environments.
- Never commit `.env` files to version control.

## Database Management (Prisma)

### Schema Changes
- All schema changes must be made in `prisma/schema.prisma`.
- Run `npx prisma migrate dev --name <migration_name>` for development migrations.

### Migration Workflow
- Development: Apply migrations immediately with `prisma migrate dev`.
- Production: Use `prisma migrate deploy` in CI/CD pipeline.
- Never use `prisma db push` in production (it's for prototyping only).

### Seeding
- Store seed scripts in `prisma/seeds/` for development and testing.

## Testing & Quality

- Add automated tests for both backend and frontend as development continues to ensure previously developed code does not fail (regression prevention).
- Backend tests should cover API endpoints, business logic, and database operations.
- Frontend tests should cover component behavior, user interactions, and integration flows.

## Infrastructure & Deployment

- Build and run only the client and server services as Docker images.
- Orchestrate local and shared development workflows exclusively with Docker Compose while PostgreSQL and MinIO stay externally hosted.

## Documentation & Collaboration

- `/docs` is the canonical source for architecture decision records (ADRs), runbooks, and compliance artifacts.
- Developers must generate and share screenshots of any UI changes/updates whenever a frontend change is made.
- All changes must be logged in `changelog.md` in the root of the repo with timestamps in **Indian Standard Time (IST)** format: `YYYY-MM-DD HH:MM:SS IST` (e.g., `2025-10-25 14:30:00 IST`). Developers must add timestamps manually after making changes.

## Error Handling & Observability

- All error handling must be carried out via centralized error handling defined in `shared/error-handling.js`.
- Frontend must display human-readable error messages for all 4xx and 5xx responses.
- Logs must include request IDs and trace IDs to enable cross-service debugging.

## Logging Standards (Winston + Morgan)

### Log Levels
- **error**: System failures, unhandled exceptions, critical issues requiring immediate attention
- **warn**: Deprecated API usage, potential issues, recoverable errors
- **info**: Successful operations, user actions, system events
- **debug**: Detailed information for development and troubleshooting (disabled in production)

### What to Log
- All API requests/responses (use Morgan middleware)
- Authentication attempts (success and failure)
- Database operations (queries, migrations, errors)
- External service calls (MinIO uploads, email sends, third-party APIs)
- Policy enforcement decisions (Casbin allow/deny)

### What NOT to Log
- Passwords or JWT tokens
- Full request bodies containing sensitive data (PII, financial info)
- Full database records (log IDs and operation types instead)
- API keys or secrets

### Log Format
- Use structured JSON logs for production: `{ timestamp, level, message, requestId, userId, metadata }`
- Include request IDs in all logs to trace requests across services
- Store logs in `logs/` directory with daily rotation
- Retain logs for at least 30 days for audit purposes

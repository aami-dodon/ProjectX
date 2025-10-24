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

## Security & Data Handling

- Enforce least privilege via Casbin policies and JWT-based session flows.
- Secure all service-to-service traffic with HTTPS/TLS and scoped credentials.
- Manage secrets via the designated vault service (**AWS Secrets Manager** by default).
- Validate and track evidence uploads with SHA-256 checksums, audit logs, and linkage back to PostgreSQL metadata.

## Development Workflow

- Follow JavaScript linting/formatting conventions (ESLint, Prettier) and keep `.env.example` configuration templates current.
- Preserve API contracts with OpenAPI specs and JSON schemas stored in `/api/docs`. Developers must add Swagger/OpenAPI documentation lines directly in the code wherever a new API is created or an existing API is updated.
- Coordinate breaking changes through versioning, migration notes, and announcements in the #dev-updates channel.

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
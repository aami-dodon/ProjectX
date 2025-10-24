# Project X Developer Guideline (Updated)

## Mission & Product Focus
Write Code:
- Easy to maintain
- Easy to make Changes
- Easy to Migrate for Future Enhancement
- Respects Monorepo strcucture

## Tech Stack & Module Ownership
- **Language:** 100% JavaScript across frontend, backend, tests, and tooling (no TypeScript anywhere). 
- **Frontend:** React (Vite toolchain) with React Router, TailwindCSS + shadcn/ui, Lucide icons, and Tiptap editor for evidence authoring/upload.
  - For UI reference and guidelines you must comply with: `reference/ui-reference.md`
- **Backend:** Express on Node.js organized by feature modules:
  - `Auth`, `Governance Engine`, `Frameworks`, `Evidence`, `Notifications`, `Tasks`
  - Ownership of modules is mapped in `/docs/module-ownership.md` and is reviewed quarterly.
- **Data:** Prisma ORM with **externally hosted PostgreSQL**; evidence binaries stored in **externally hosted MinIO** via presigned URLs.
- **Shared Logic:** Place cross-cutting utilities (e.g., date/time utils, schema validators, shared middleware) in `shared/`; keep third-party integrations in `server/src/integrations/`.

## Security & Data Handling
- Enforce least privilege via Casbin policies and JWT-based session flows.
- Secure all service-to-service traffic with HTTPS/TLS and scoped credentials.
- Manage secrets via the designated vault service (**AWS Secrets Manager** by default).
- Validate and track evidence uploads with SHA-256 checksums, audit logs, and linkage back to PostgreSQL metadata.

## Development Workflow
- Follow JavaScript linting/formatting conventions (ESLint, Prettier) and keep `.env.example` configuration templates current.
- Preserve API contracts with OpenAPI specs and JSON schemas stored in `/api/docs`.
- Coordinate breaking changes through versioning, migration notes, and announcements in the #dev-updates channel.

## Testing & Quality
- Add automated tests.

## Infrastructure & Deployment
- Build and run only the client and server services as Docker images.
- Orchestrate local and shared development workflows exclusively with Docker Compose while PostgreSQL and MinIO stay externally hosted.

## Documentation & Collaboration
- `/docs` is the canonical source for architecture decision records (ADRs), runbooks, and compliance artifacts.
- You must generate a screenshot of any UI changes/updates whehever as frontend change is made
- All changes must be logged in `changelog.md` in the root of the repo with timestamps in **Indian Standard Time (IST)**. Timestamps will be auto-populated via CI.


## Error Handling & Observability
- All backend errors must follow the standardized format defined in `shared/error-handling.js`.
- Frontend must display human-readable error messages for all 4xx and 5xx responses.
- Logs must include request IDs and trace IDs to enable cross-service debugging.



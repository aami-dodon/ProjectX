# Project X Developer Guideline

## Mission & Product Focus
- Deliver the AI Governance Platform that automates evidence capture, control alignment, and continuous compliance for EU AI Act, ISO 42001, NIST AI RMF, GDPR, and adjacent standards.
- Prioritize regulator-ready transparency, auditability, and collaboration features across compliance, risk, and engineering teams.

## Tech Stack & Module Ownership
- **Language:** 100% JavaScript across frontend, backend, tests, and tooling (no TypeScript anywhere).
- **Frontend:** React (Vite toolchain) with React Router, TailwindCSS + shadcn/ui, Lucide icons, and Tiptap editor for evidence authoring/upload.
  - For UI reference and guidelines you must comply with: `reference/ui-reference.md`
- **Backend:** Express on Node.js organized by feature modules (Auth, Governance Engine, Frameworks, Evidence, Notifications, Tasks) with Casbin RBAC, JWT auth, Nodemailer, and structured logging (Winston + Morgan).
- **Data:** Prisma ORM talking to externally hosted PostgreSQL; evidence binaries stored in externally hosted MinIO via presigned URLs.
- **Shared Logic:** Place cross-cutting utilities in `shared/`; keep integrations in `server/src/integrations/`.

## Security & Data Handling
- Enforce least privilege via Casbin policies and JWT-based session flows.
- Secure all service-to-service traffic with HTTPS/TLS and scoped credentials; manage secrets via cloud vaults.
- Validate and track evidence uploads with checksums, audit logs, and linkage back to PostgreSQL metadata.

## Development Workflow
- Follow JavaScript linting/formatting conventions (ESLint, Prettier) and keep `.env.example` configuration templates current.
- Preserve API contracts with OpenAPI specs and JSON schemas; coordinate breaking changes with versioning and migration notes.

## Testing & Quality
- Maintain the testing pyramid in JavaScript: Jest (backend), Vitest (frontend), Cypress (E2E), Postman/Newman (API), k6 (performance), OWASP ZAP/Snyk (security).
- Target ≥85% unit coverage, ≥80% frontend coverage, and full coverage of critical user journeys; fail CI/CD on unmet thresholds.
- Store fixtures and mocks alongside module tests (`server/tests`, `client/tests`); isolate test data in dedicated databases/buckets.

## Infrastructure & Deployment
- Build and run only the client and server services as Docker images; orchestrate local and shared development workflows exclusively with Docker Compose while PostgreSQL and MinIO stay externally hosted.
- Coordinate staging and production rollouts through CI-published container images and ops-managed deployment runbooks while formal IaC tooling is deferred.
- Integrate monitoring via Prometheus/Grafana, centralized logging (ELK/Loki), and alerting (Alertmanager, PagerDuty/Slack).

## Documentation & Collaboration
- Treat `/docs` as the canonical source: update ADRs, runbooks, and compliance artifacts alongside code changes.
- Capture integration details, change logs, and governance impacts in PR descriptions and release notes. You will not add any chatgpt url in the PR.
- Capture all changes in "changelog.md" in the root of repo with timestamps in Indian Standard Time.

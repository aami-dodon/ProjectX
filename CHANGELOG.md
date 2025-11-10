## 2024-11-03 11:39:53 IST
- Added a `DEMO_FLAG` environment toggle so the server auto-seeds (and refreshes) the full demo workspace during startup via `server/src/modules/demo/demo.seed.js`, removed the old `scripts/demo-data.js`, and refreshed the backend/onboarding docs to describe the flag-driven workflow.

## 2024-11-05 14:22:47 IST
- Corrected the governance posture score cards so the home overview and governance overview surfaces scale the value as a 0–100 percentage instead of 100× too large, ensuring the trend, delta, and summary metrics now show realistic posture percentages.

## 2024-11-07 16:10:30 IST
- Added an access & authentication guide (`docs/05-user-guides/00-platform-access.md`) describing login, password changes, and resets, and captured actual login/change/reset screenshots from the running frontend (`docs/05-user-guides/images/{login,change-password,reset-password}.png`) so the documentation references real UI state.

## 2024-11-08 17:33:57 IST
- Added role-specific end-user guides for Compliance Officer, Risk & Audit Manager, AI/ML Engineer, IT/Security Administrator, Product/Business Owner, and System Administrator in `docs/05-user-guides`, each outlining workflows, troubleshooting, and referenced screenshots, and captured every referenced UI (governance overview, review queue, probes registry, access control, dashboards, and system health) to keep the guides aligned with the live frontend.

## 2024-11-09 00:42:09 IST
- Replaced the `/home` dashboard mock (SectionCards/ChartArea/DataTable) with the live governance overview: the page now loads `useGovernanceOverview`, surfaces summary cards, trend, review queue, spotlight controls, runs, and evidence links, and all placeholder components/data files were removed.

## 2024-11-09 21:32:55 IST
- Hardened `scripts/demo-data.js` so it tags every seeded record with a demo marker, removes only those records (instead of truncating tables or deleting existing users), and fails fast when migrations are missing—making the demo workflow safe to run in populated environments.

## 2024-11-19 12:06:12 IST
- Added `scripts/demo-data.js` so developers can seed or clear a full set of governance, evidence, probe, and reporting demo records (flagged via `--clear`/`--delete`), and documented the workflow in the backend and onboarding guides so the toolchain stays aligned with the Prisma schema.

## 2024-11-19 16:21:16 IST
- Launched the Dashboard and Reporting system end-to-end: new Prisma models/migration (`report_scores`, `report_metrics`, `report_exports`, `report_audit_log`, `report_widgets` + enums), the Express reporting module (`/api/reports` dashboards + export jobs, caching worker, RBAC resources, MinIO-backed artifact handling, env knobs, and docs), plus the React dashboards/exports experience (feature slice under `client/src/features/dashboards`, reusable charts + hooks, sidebar/nav wiring, and the export scheduler modal) so compliance teams can visualise posture/remediation/evidence metrics and schedule attestation packs from one workspace.

## 2024-11-20 23:21:21 IST
- Delivered the Task Management system end-to-end: new Prisma models/migration for `tasks`, `task_events`, `task_assignments`, `task_evidence_links`, `task_sla_metrics`; the Express module (`/api/tasks` router, services, repositories, SLA scheduler, verification queue, Jira/ServiceNow adapters, RBAC resources, env knobs) plus full React experiences (inbox, drag-and-drop board, detail timeline/evidence/sync widgets, shared hooks/components) and updated developer/RBAC docs so remediation work can be created, escalated, synced, and audited alongside governance controls.

## 2024-11-24 18:56:44 IST
- Delivered the Governance Engine overview experience end-to-end: new Express endpoints for `/api/governance/overview`, batch `/runs`, and score `/recalculate` (with refreshed RBAC/doc coverage) plus the React governance dashboard (scorecard, trend chart, remediation + evidence matrix, batch operations panel, and sidebar entry) so compliance teams can monitor posture, trigger reruns, and refresh control scores from a single screen.

## 2024-11-29 02:29:00 IST
- Delivered the end-to-end Evidence Management system with new Prisma models/migrations, Express routers/services (`/api/evidence` list/upload/metadata/link/retention endpoints), and the React evidence workspace (library, upload wizard, detail timeline/linking panel, retention dashboard, shared API hooks/components) plus updated RBAC seeds and documentation so compliance teams can collect, govern, and audit artifacts alongside controls and checks.

## 2024-11-29 20:49:00 IST
- Added framework lifecycle controls with audited retire/restore APIs and UI actions so compliance teams can sunset frameworks with context and bring them back without recreating mappings or losing history.

## 2024-11-30 17:00:26 IST
- Launched the Control Management system end-to-end with new Prisma models (`controls`, mappings, scores, audit events), Express governance APIs for catalog/mapping/scoring/remediation, updated developer docs, and the React control catalog, detail, mapping, and scoreboard experiences so compliance teams can curate controls, align frameworks, inspect score trends, and trigger remediation from one workflow.

## 2024-12-01 13:19:39 IST
- Delivered the Framework Mapping system end-to-end with new Prisma models, Express routers, and React dashboards so teams can catalog frameworks, manage controls, align cross-standard mappings, and govern version lifecycles alongside the rest of the governance suite.

## 2024-12-02 03:11:59 IST
- Launched the Check Management system with new Prisma models, Express governance APIs, background scheduler helpers, and React dashboards for the catalog, review queue, and result explorer so compliance teams can operationalise checks end-to-end.

## 2024-12-04 02:26:29 IST
- Shipped the Probe Management System end-to-end with Prisma tables, Express APIs, Probe SDK helpers, and the new Vite probe dashboards so operators can register probes, launch deployments, schedule runs, and monitor health from one workflow.

## 2024-12-05 05:45:53 IST
- Introduced the RBAC administration module with Casbin-backed policy APIs and new Access Control dashboards so administrators can manage roles, permissions, and access reviews from a unified console.

## 2024-12-05 16:31:14 IST
- Restructured the admin frontend into design-system, health, and user-management submodules with shared hooks and exports so future dashboards stay isolated and maintainable.

## 2024-12-07 02:37:10 IST
- Enhanced audit log filtering to support action, user, and date range queries while ensuring responses document actor IDs for downstream integrations.

## 2024-12-09 18:50:25 IST
- Extended the audit log experience to show formatted field changes, impacted users, modifiers, and precise timestamps while filtering routine date noise.

## 2024-12-10 13:46:54 IST
- Optimized the admin user directory to use backend-driven pagination, sorting, and filtering while keeping global metrics accurate and responsive.

## 2024-12-10 16:17:15 IST
- Restored the sidebar account avatar to render in full color by removing the grayscale filter from the user menu.

## 2024-12-10 16:37:00 IST
- Removed the customer branding experience and API so the workspace shell always displays the default Project X identity.

## 2024-12-11 13:12:51 IST
- Matched the admin branding form's default logo preview to the shared customer branding icon so the fallback imagery stays consistent across the app.

## 2024-12-13 09:07:58 IST
- Refactored the sidebar customer identity into a shared UI component so the logo and title rendering can be reused across layouts.

## 2024-12-14 07:47:28 IST
- Updated admin branding copy to refer to customers instead of clients, aligning validation messages and breadcrumb labels with the standard terminology.

## 2024-12-14 13:40:24 IST
- Wrapped the application layout in the shared ScrollArea and added fallback scrollbar styling so every page uses the shadcn theme consistently.

## 2024-12-15 01:31:58 IST
- Removed the Operations navigation group and its submenu links from the primary sidebar so the workspace menu reflects the current feature set.
## 2024-12-15 13:32:03 IST
- Removed the header copy and status controls from the Design System and System Health dashboards to streamline their layouts.

## 2024-12-21 16:39:40 IST
- Matched the Design System and System Health dashboards to the full-width admin layout so they align with User Management and Customer Details pages.
## 2024-12-23 10:47:29 IST
- Updated the Customer Branding settings preview to render the Project X lettermark when no custom logo is set so the default matches the latest identity system.
## 2024-12-24 06:30:35 IST
- Moved the System Health and Design System dashboards under the administrator sidebar section so both routes surface as admin-only submenu links.

## 2024-12-24 10:49:00 IST
- Normalized admin role checks on the API so administrators keep access even when their assigned role casing varies, and added regression coverage for the middleware guard.

## 2024-12-24 18:34:16 IST
- Removed the configurable search placeholder from the Customer Details branding settings and now always display "Search the workspace..." in the header search bar.

## 2024-12-25 13:40:05 IST
- Renamed the admin workspace branding experience to "Customer Details" and removed the extra helper copy beneath the heading so the page reflects the new terminology.

## 2024-12-31 11:50:54 IST
- Documented the standard `server/logs` and `client/logs` locations, exported the server log directory for reuse, and added a regression test so logging stays consistent across the stack.

## 2024-12-31 22:10:05 IST
- Fixed the branding settings repository to consume the Prisma client correctly, preventing runtime crashes when administrators save workspace identity updates.

## 2025-01-04 22:05:17 IST
- Added a persisted workspace branding API with admin controls to upload logos into `client/public/branding` and update layout copy so the sidebar and header reflect customized workspace identity.

## 2025-01-07 12:53:51 IST
- Added a centralized audit trail with Prisma middleware, contextual request metadata, and an admin audit viewer so every data mutation is transparently logged.

## 2025-01-11 19:06:14 IST
- Automated the favicon build step so the SVG logo colour is re-generated from `client/src/index.css` during `npm run build`, ensuring theme updates propagate to the icon without manual edits.
## 2025-01-12 01:36:23 IST
- Synced the favicon with the active theme by regenerating it from the resolved CSS logo colour so browser tabs update alongside light and dark mode.

## 2025-01-14 10:51:49 IST
- Expanded the favicon lettermark to improve legibility and introduced a shared `--logo-color` token in `client/src/index.css` so future palette updates automatically carry over to the icon.

## 2025-01-15 20:44:05 IST
- Replaced the favicon with an inline letter X SVG that inherits the primary theme colour so it stays in sync with the design tokens.

## 2025-01-16 22:00:57 IST
- Removed the Search, Help Centre, Appearance, and Account Settings links from the sidebar so only the primary navigation surfac
  es to users.

## 2025-01-17 21:52:56 IST
- Styled success toast notifications to use primary text on muted backgrounds so they align with the semantic design tokens.

## 2025-01-18 00:38:45 IST
- Rebuilt the sidebar navigation structure with new grouped menus and submenus so admins and members see the appropriate sections in the app shell.

## 2025-01-19 15:20:29 IST
- Made the application sidebar submenus collapsible with shadcn-style triggers so nested navigation groups can be expanded or hidden as needed.

## 2025-01-19 18:58:28 IST
- Added a toast notification showcase to the design system page so teams can preview success, info, warning, error, and promise interactions in one place.

## 2025-01-20 00:36:36 IST
- Reworked toast notification theming so success, info, warning, and error states pull their background, border, and text colours directly from the primary design tokens in `client/src/index.css`, ensuring they follow light and dark mode palettes.

## 2025-01-22 17:34:05 IST
- Updated the toast notifications to pull their background, border, and accent colours from `client/src/index.css` so success, info, warning, and error messages respect the active theme.

## 2025-01-25 02:22:26 IST
- Standardised the admin user table toolbar control sizes so the search, filter dropdowns, and action buttons align evenly on desktop.

## 2025-01-25 07:32:46 IST
- Updated the admin user management hook to aggregate all paginated API results so the table once again lists every account after the backend pagination change.

## 2025-01-27 10:39:19 IST
- Retuned chart color tokens in `client/src/index.css` so data visualisations align with the app's primary palette.

## 2025-01-27 13:15:23 IST
- Aligned Tailwind's status utility colors with the design tokens in `client/src/index.css` so info, success, warning, and danger accents match the app palette.

## 2025-01-31 05:02:53 IST
- Replaced the account page's forgot password card with an in-app password reset form that validates the current secret, updates it via the API, and signs the user out so they log in with the new credentials.

## 2025-02-09 23:32:12 IST
- Restructured the account settings page with a wider account details column, a companion password reset form, and left-aligned avatar controls for consistency.

## 2025-02-10 20:18:05 IST
- Prevented administrators from modifying their own role assignments and surfaced guidance in the admin user drawer.

## 2025-02-12 03:17:43 IST
- Fixed the admin user charts so the donut and trend cards align with each other and their header controls.

## 2025-02-13 03:39:16 IST
- Added a ScrollArea wrapper to admin drawers so long user details and forms scroll smoothly across browsers.

## 2025-02-13 06:52:25 IST
- Automatically verify user email addresses when admins activate an account so status changes keep verification aligned.

## 2025-02-13 11:28:12 IST
- Added an activate action to the admin user table menu so suspended or pending accounts can be restored in place.

## 2025-02-13 14:47:07 IST
- Removed the status detail row from the admin user drawer to keep the panel focused on activity metadata.

## 2025-02-15 00:23:49 IST
- Removed the email and verification summary from the admin user drawer to declutter the details panel.

## 2025-02-16 03:56:24 IST
- Restyled the admin user charts with gradient cards and responsive layouts to align with the refreshed statistics visuals.

## 2025-02-20 10:13:13 IST
- Enabled admins to update user email addresses and mark them as verified with refreshed drawer UI, API validation, and tests.

## 2025-02-20 20:44:21 IST
- Enriched admin user listings with presigned avatar URLs and updated the management drawer to render the images with new tests.

## 2025-02-23 07:10:47 IST
- Refined the admin status distribution donut chart to normalize data colors and surface the total user count inline.

## 2025-02-26 05:39:29 IST
- Matched the admin user management table UI to the shared outline data table, reusing the drawer and layout for consistency.

## 2025-02-27 15:01:44 IST
- Blocked suspended or inactive accounts from authenticating API requests and added middleware coverage for the guard.

## 2025-02-28 17:02:59 IST
- Removed tenant support across authentication flows, admin tooling, and demo utilities, including a schema migration and UI updates.

## 2025-03-03 07:41:24 IST
- Rebuilt the admin user management table with a dedicated layout, filters, and drawer so it no longer depends on the shared data-table component.

## 2025-03-06 17:20:50 IST
- Enabled multi-role assignment in the admin user management suite, including API support, a role picker in the drawer, and refreshed documentation.

## 2025-03-07 10:58:23 IST
- Unified the shared data table row drawer with consistent view/edit tabs and updated the home outline and user management tables to consume the new UI.

## 2025-03-07 16:54:53 IST
- Pointed the demo user loader at a reusable CSV dataset and enforced a 100-user minimum for consistent seeding.

## 2025-03-07 18:16:06 IST
- Added a reusable `scripts/manage-demo-users.sh` helper to seed or purge tagged auth demo users for quick testing resets.

## 2025-03-08 00:36:02 IST
- Documented reuse guidelines for the admin backend module and added the missing module README.

## 2025-03-08 11:44:15 IST
- Redirected post-logout navigation to the public home route so users return to the pre-login experience after signing out.

## 2025-03-08 12:53:13 IST
- Improved authentication UX: the frontend now auto-refreshes expired access tokens on 401s, retries the original request, and only redirects to login if refresh fails. This removes spurious errors on admin pages after periods of inactivity.

## 2025-03-09 14:25:23 IST
- Restored the post-login redirect by syncing auth status updates with the custom `px:user-updated` event so successful sign-ins reach `/home` without refreshing.

## 2025-03-09 21:35:16 IST
- Introduced an admin-only user management suite with new API endpoints, dashboard cards/charts/table editing, and dedicated navigation links to health and design system views.

## 2025-03-12 12:49:30 IST
- Standardised presigned download links to reuse the configured MinIO expiry (one hour by default) and documented the behaviour.

## 2025-03-13 23:44:35 IST
- Wired the account settings page to the authenticated profile APIs, uploading avatars through MinIO and persisting email/name updates on the server with refreshed sidebar avatars.

## 2025-03-15 20:19:33 IST
- Added an account settings page with profile editing and avatar uploads, linked from the sidebar Account menu for quick self-service updates.

## 2025-03-16 23:05:42 IST
- Added an account settings page with profile editing and avatar uploads, linked from the sidebar Account menu for quick self-service updates.

## 2025-03-18 13:50:13 IST
- Moved the logout action from the dashboard header into the sidebar profile menu so sign-out sits alongside account controls.

## 2025-03-20 10:49:46 IST
- Added authenticated profile endpoints (`GET/PATCH /api/auth/me`), service helpers, tests, and documentation so operators can self-manage display names while keeping responses aligned with the sanitized auth payload.

## 2025-03-21 01:48:12 IST
- Documented reuse guidelines for the auth, files, and health backend modules so developers can onboard quickly.

## 2025-03-23 01:52:00 IST
- Updated routing so the login experience lives at `/`, `/home` becomes the authenticated landing page, and post-login visitors are redirected away from auth screens and onto guarded dashboards.

## 2025-03-24 08:39:37 IST
- Refactored the MinIO integration into a presigned-URL storage service with authenticated file routes and private bucket access controls.

## 2025-03-24 15:07:56 IST
- Removed the MinIO upload diagnostic route and health dashboard tester so the stack no longer exposes the `/api/upload/test` endpoint.

## 2025-03-27 04:08:10 IST
- Retired the standalone email module and test diagnostics so all SMTP traffic flows through the mailer integration and the health dashboard no longer links to the removed endpoint.

## 2025-03-29 09:53:00 IST
- Centralised backend email sending through the mailer integration and updated the email service to use the shared helper.

## 2025-04-02 18:17:21 IST
- Added a logout control to the dashboard header so signed-in users can clear their session and return to the login screen.

## 2025-04-04 06:31:42 IST
- Reworked the client router so unauthenticated visitors land on the login layout at `/` while authenticated users keep the dashboard at the root and receive 404s for unknown routes.

## 2025-04-04 10:53:31 IST
- Redirected the auth shell's base and unknown routes to the login screen so pre-login navigation bypasses layout-level 404s and relies on the global error pages.

## 2025-04-06 04:35:09 IST
- Restricted the home dashboard route behind authentication so unauthenticated visitors are redirected to the login screen.

## 2025-04-09 12:55:12 IST
- Updated the client authentication forms to call the `/api/auth/*` endpoints so logins and password flows reach the Express router successfully.

## 2025-04-10 03:14:32 IST
- Ensured the production server container runs `prisma migrate deploy` before booting so required tables are created automatically.

## 2025-04-12 00:50:57 IST
- Added the initial Prisma migration to create auth and health tables so the API can provision its database schema reliably.

## 2025-04-14 21:04:05 IST
- Implemented the full user management system across the API and React client, including JWT authentication, session rotation, password reset flows, verification emails, and refreshed auth layouts with actionable feedback and toasts.

## 2025-04-17 01:35:51 IST
- Added server test coverage for the email and upload diagnostics to verify happy paths, validation failures, and integration errors.

## 2025-04-22 00:19:54 IST
- Added automated client/server test runners with Vitest and Jest plus CI coverage so pull requests verify both apps end-to-end.

## 2025-04-24 23:30:42 IST
- Refreshed the design system typography section to read index.css CSS custom properties for headings, body copy, and token references.

## 2025-04-25 05:22:29 IST
- Added shared ESLint and Prettier workflows for the client and server, including CI checks to block merges on lint or formatting errors.
## 2025-04-25 10:50:12 IST
- Streamlined client imports by introducing index files for shared UI/components and updating aliases.

## 2025-05-02 03:37:31 IST
- Added a rich text editor section to the design system page showcasing the shared TextEditor component with live preview and HTML output.

## 2025-05-05 13:08:14 IST
- Documented the `LOG_LEVEL` and `VITE_LOG_LEVEL` environment variables so deployments can tune logging verbosity across the stack.

## 2025-05-06 02:34:56 IST
- Renamed the upload presign diagnostic endpoint to `/api/upload/test` and updated the health dashboard MinIO upload tester to call the new route.

## 2025-05-09 02:21:52 IST
- Standardised server logging calls to use message-first signatures so Winston metadata stays consistent across modules.

## 2025-05-09 11:25:00 IST
- Locked in the removal of the legacy health email and presign endpoints by adding regression coverage for 404 responses.

## 2025-05-10 09:39:40 IST
- Retired the duplicated health presign and email test routes, updating the health dashboard to call the dedicated `/api/upload` and `/api/email` services instead.

## 2025-05-12 16:53:03 IST
- Refactored the email and upload services into modular routers with shared helpers so health diagnostics reuse the new upload utility.

## 2025-05-13 05:54:22 IST
- Expanded the `/api/health/storage/presign` OpenAPI notes with file upload guidance, concrete examples, and a shell snippet.

## 2025-05-19 16:26:04 IST
- Relocated the Redoc documentation portal to `/api/redocs` and updated asset paths to keep the docs page working under the new URL.

## 2025-05-21 15:55:33 IST
- Copied the bundled Redoc assets into the production server container so `/docs` resolves `index.html` without filesystem errors.

## 2025-05-24 17:58:02 IST
- Fixed the `/docs` route to serve the locally bundled Redoc assets so the page loads correctly in production containers.

## 2025-05-28 11:52:38 IST
- Hosted the Redoc assets locally and removed inline scripts so `/docs` complies with the CSP enforced by Helmet.

## 2025-05-29 10:00:36 IST
- Added a Redoc-powered documentation portal at `/docs` that sources `/api/docs.json` while keeping the Swagger UI unchanged.

## 2025-05-31 02:50:47 IST
- Removed the unused `/api/email/test` and `/api/storage/upload` endpoints along with their routers from the Express backend.

## 2025-06-02 14:52:07 IST
- Updated the Swagger docs to serve the branded SVG favicon and Project-X browser title at `/api/docs`.

## 2025-06-07 05:27:03 IST
- Corrected the Swagger server base URL so endpoints now call `/api/...` without duplicating the prefix.

## 2025-06-09 00:52:18 IST
- Restored the default Swagger UI styling by removing the custom theme, favicon, and title overrides from `/api/docs`.
## 2025-06-09 04:15:01 IST
- Documented health, storage, and email endpoints with detailed OpenAPI JSDoc so `/api/docs` now lists their request and response contracts.
## 2025-06-12 01:18:06 IST
- Switched the frontend theme provider to default to dark mode and set the root HTML class so the app loads with dark styling by default.
## 2025-06-13 20:01:27 IST
- Restyled the Swagger documentation theme with a high-contrast dark mode palette to improve readability at `/api/docs`.

## 2025-06-16 02:49:49 IST
- Updated Swagger UI to load the favicon from `server/src/config/favicon.svg` for the `/api/docs` page.
 
## 2025-06-16 19:26:38 IST
- Reintroduced Swagger documentation with a branded UI at `/api/docs`, powered by swagger-ui-express and swagger-jsdoc, including Tailwind/Shadcn styling and the shared favicon.
## 2025-06-21 09:33:46 IST
- Updated the client HTML metadata with an SEO-optimised Project-X title, governance-focused descriptions, and social sharing tags.

## 2025-06-21 13:46:20 IST
- Simplified the health dashboard by removing the CORS configuration and status overview cards.

## 2025-06-23 16:06:05 IST
- Removed API versioned prefixes from the Express server so routes now mount under `/api`, updating the health feature clients accordingly.
- Updated repository documentation to reference the unversioned `/api` paths across backend, integration, and system guides.

## 2025-06-23 19:12:54 IST
- Forced the client Vite config to align `NODE_ENV` with the active mode so React no longer throws dead code elimination errors when local development uses production environment variables.
## 2025-06-23 21:43:20 IST
- Split the health dashboard metrics into backend and frontend sections with browser runtime insights and refined progress cards.
- Extended the health API to expose structured backend host and process telemetry so the UI can display accurate CPU, memory, and disk values.

## 2025-06-27 17:59:12 IST
- Refreshed the `/health` dashboard with a minimal lucide-driven layout and inline CPU, memory, and disk summaries.
- Extended the health API to expose runtime CPU, memory, and disk usage snapshots for the updated dashboard metrics.

## 2025-06-30 14:06:56 IST
- Ensured both the client build tooling and Express server load `NODE_ENV` from `.env` files with a default of `development` so logging and bundling respect the configured environment.
## 2025-07-03 19:03:28 IST
- Updated the sidebar trigger to display a hamburger icon on mobile viewports while keeping the panel icon on larger screens.
## 2025-07-03 22:57:37 IST
- Added a `/design-system` single page route mirroring the health layout with typography, color tokens, and comprehensive component showcases for shared UI primitives.
- Linked the design system entry from the sidebar utility navigation so the documentation hub is reachable in-app.
## 2025-07-07 04:53:03 IST
- Rewrote the root `agents.md` guidance to match the current client/server stack, integration points, and workflow expectations.

## 2025-07-08 11:00:49 IST
- Standardized backend imports to use the `@/` module alias across server modules and updated Jest configuration for the alias mapping.

## 2025-07-09 12:11:24 IST
- Removed the request context middleware and AsyncLocalStorage store from the server.
- Updated logging, health checks, and error handling to operate without request-scoped identifiers.

## 2025-07-09 17:46:52 IST
- Added presigned MinIO upload tooling to the health dashboard with an inline preview card for verifying object storage connectivity.
- Introduced an email delivery test form so operators can validate SMTP credentials directly from the health page.
- Extended the health API with presign and email test endpoints that reuse centralized error handling and mailer services.
## 2025-07-10 03:41:42 IST
- Retired the legacy UI reference document under `reference/` and pointed developer guidance to `docs/04-developer-instructions/frontend` for frontend standards.

## 2025-07-10 19:25:30 IST
- Restored Swagger references in repository documentation while keeping the backend implementation Swagger-free per product direction.

## 2025-07-11 05:03:07 IST
- Removed the Swagger-based API documentation tooling from the server by deleting the config, docs route, and annotations while cleaning up dependencies and tests.

## 2025-07-12 14:07:49 IST
- Embedded the PDF dossier generators directly into their Bash entrypoints and removed the migrated Python modules.
## 2025-07-14 12:54:05 IST
- Added shadcn/ui-powered error and not-found experiences, routing them through the global and auth route configurations to handle HTTP failures consistently.

## 2025-07-14 13:47:57 IST
- Extended `scripts/scaffold-feature.sh` with an action selector that can remove feature modules, clean up router imports, and delete feature directories alongside the existing scaffolding workflow.

## 2025-07-17 01:22:09 IST
- Replaced the Node.js feature scaffolding CLI with a Bash implementation that prompts for layouts, creates feature skeletons, and registers routes in the client router.

## 2025-07-20 18:21:41 IST
- Nested the authentication routes under `/auth/*`, moving the route configuration and layout into `client/src/features/auth`.
- Updated all authentication links and forms to target the new `/auth` paths after removing the obsolete blank layout wrapper.

## 2025-07-21 17:42:52 IST
- Added dedicated auth flow pages for forgot password, password reset, and verification along with their reusable form components and registered routes in the blank centered layout.

## 2025-07-23 17:27:08 IST
- Added a `scripts/scaffold-feature.js` automation to scaffold client features, prompt for a layout, and register routes in the router configuration.

## 2025-07-25 00:41:23 IST
- Added a full-stack health monitoring feature with a `/health` dashboard that consumes the new `/api/health` endpoint for system, database, and CORS diagnostics.
- Introduced an Axios API client, auto-refreshing health hook, and shadcn/ui status cards to surface uptime, latency, and configuration warnings in the frontend.
- Registered the health API module with Express using feature-based controllers, services, and repositories while aligning the CORS middleware with the enforced policy.

## 2025-07-25 12:16:46 IST
- Clarified the recommended `CLIENT_USE_SECURE_HMR` settings in `.env.example`, noting to enable secure WebSockets when the dev server is proxied through HTTPS providers like Cloudflare.

## 2025-07-27 15:18:25 IST
- Added environment switches so the Vite dev server upgrades HMR connections to WSS when required by secure deployments.
- Documented the new HMR configuration flags in `.env.example` to guide remote development setups.

## 2025-07-27 17:16:31 IST
- Renamed `client/src/app/layouts/MainLayout.jsx` to `DefaultLayout.jsx` and updated the router to consume the new default layout component.
- Refactored the dashboard feature into `client/src/features/home`, renaming `DashboardPage.jsx` to `HomePage.jsx` and aligning all feature imports with the new path.
- Adjusted the client scaffolding script to scaffold the `home` feature module structure and updated messaging to match the renamed home page entry point.

## 2025-07-27 23:03:33 IST
- Converted the Vite alias map to an ordered array so nested aliases like `@/layout` resolve before the root `@` mapping, unblocking dashboard imports.
- Hooked the dashboard layout and feature wrappers into the shared sidebar, header, chart, table, and card implementations via lightweight re-exports.
- Filled in the shared `cn` utility so all shadcn/ui primitives compile again and verified the client build succeeds.

## 2025-07-28 17:58:58 IST
- Replaced relative client imports with the `@/` alias across home feature components, editor primitives, and router modules to standardize pathing.
- Updated the home feature README to reference the alias-based import pattern for future contributors.
- Confirmed the Vite alias configuration and IDE path mapping already point `@` to `client/src`.

## 2025-07-29 20:06:04 IST
- Moved the dashboard AppSidebar and SiteHeader components into `client/src/components/custom-ui/` and updated the layout to import them from their new location.

## 2025-07-29 21:27:23 IST
- Removed the design system feature bundle and its `/design-system` route to simplify the client build.

## 2025-07-30 09:37:28 IST
- Locked the dashboard shell to the viewport height, ensuring only the main content pane scrolls so routes like `/design-system` no longer trigger an extra page scrollbar.
- Forced `html`, `body`, and `#root` to span 100% height with the body set to `overflow-hidden` so the browser scrollbar stays disabled while nested layout panes handle scrolling.

## 2025-07-30 10:02:28 IST
- Restyled `client/src/components/ui/SiteHeader.jsx` with shadcn/ui primitives, introducing the icon toggle button, vertical separator, and block-aligned header text to match the dashboard shell reference.

## 2025-08-01 04:06:45 IST
- Reworked the home feature hero, navigation, checklist, knowledge, and onboarding sections to use shadcn/ui cards and buttons
  instead of bespoke Tailwind wrappers so the dashboard aligns with the shared component system.

## 2025-08-01 17:00:35 IST
- Matched the dashboard grid column width to the sidebar's 18rem rail so the header and sidebar borders align cleanly without overlap.

## 2025-08-02 17:26:00 IST
- Added a profile dropdown menu to the AppSidebar that mirrors the reference layout with account, billing, notifications, and logout actions.

## 2025-08-02 20:09:56 IST
- Tightened the AppSidebar layout to left-align navigation items, reduce vertical spacing, and lock the rail height without scroll to match design guidance.

## 2025-08-04 08:43:51 IST
- Inlined the single page layout shell within the home, health, and theme pages to remove the shared layout dependency.
- Deleted `client/src/app/layout/SinglePageLayout.jsx` after migrating each page to a self-contained structure with embedded headers.

## 2025-08-05 17:22:09 IST
- Relocated the dashboard AppSidebar and SiteHeader into `client/src/components/ui` so shared layouts consume the common shell primitives directly.

## 2025-08-05 22:55:55 IST
- Modularized the home overview into a dedicated `client/src/features/home` feature so the page composes reusable hero, navigation, checklist, and resource panels.

## 2025-08-07 15:55:04 IST
- Removed the unused `client/src/app/layout/MainLayout.jsx` shell now that every route renders through the dashboard layout components.

## 2025-08-08 11:50:25 IST
- Routed every client page through `client/src/app/layout/DashboardLayout.jsx`, refreshing the sidebar links and dashboard header so navigation stays consistent across routes.
- Reworked the home overview into card-driven sections that align with the dashboard shell for navigation, launch readiness, and resource discovery.

## 2025-08-08 14:50:14 IST
- Expanded the client color system with multi-step ramps, updated shared UI primitives to the refreshed semantic utilities, and refreshed the theme page and health dashboard styling for improved contrast in light and dark modes.

## 2025-08-09 06:53:37 IST
- Added sidebar and chart design tokens to the client theme and extended Tailwind utilities to surface the regenerated palette, including the updated radius scale.

## 2025-08-10 00:36:12 IST
- Updated client theme tokens to the Violet preset from shadcn/ui and aligned success, warning, and info semantics with the shared color palette.

## 2025-08-13 15:59:40 IST
- Rebuilt the home page shell to closely mirror the shadcn/ui sidebar-07 layout with a persistent left rail, breadcrumb header, and stacked content tiles ready for production data.
- Simplified hero content into structured placeholders so the visual hierarchy matches the provided dark dashboard reference.

## 2025-08-15 13:47:48 IST
- Reimagined the home dashboard with a sidebar inspired workspace, interactive trend chart, metrics, and screenshot gallery linking to shadcn/ui resources.

## 2025-08-16 17:04:31 IST
- Promoted the ThemeToggleCard into `client/src/components/ui` and updated the Theme and Health pages to import the shared component.
- Refreshed the theme feature docs and exports to reflect the new shared component location.

## 2025-08-18 01:53:12 IST
- Reorganized the client app structure with dedicated layout and router directories under `src/app` and moved the theme page into the consolidated pages module.
- Added a primary navigation layout shell and central route configuration to match the new folder hierarchy.
- Expanded the health feature with service and utility layers, refreshed exports, and documented the module boundaries.

## 2025-08-19 03:27:32 IST
- Restructured the theme feature into components, hooks, services, and utils folders with a documented README for future growth.
- Moved the theme provider, hook, and token exports to the new layout and updated pages to consume the aggregated feature API.

## 2025-08-21 14:50:21 IST
- Relocated the email connectivity test form into the health feature so the operational dashboard owns its tooling.

## 2025-08-24 12:37:25 IST
- Refactored the client routing to use dedicated home and health pages while keeping App.jsx focused on route definitions.
- Extracted the health dashboard theme toggle into a reusable component under the theme feature for reuse across pages.

## 2025-08-24 15:31:06 IST
- Moved the theme provider and hook into `client/src/features/theme` with shared token exports for future reuse.
- Updated the app shell to consume the new feature entry point and retired the legacy `/theme` reference route.


## 2025-08-26 11:01:18 IST
- Allowed editor toolbar groups to wrap on narrow screens while preserving single-row layout on larger viewports.

## 2025-08-27 01:15:40 IST
- Added Swagger UI under `/api/docs` and autogenerated OpenAPI specs from route annotations.
- Introduced CI check (`npm run openapi:check`) to ensure the spec builds successfully during test runs.
- Documented the new API documentation workflow in `docs/02-technical-specifications/02-backend-architecture-and-apis.md`.


## 2025-08-30 01:26:24 IST
- Unified the health and theme single pages behind a shared layout shell with a centralized header that links back home.
- Matched typography, button variants, and Lucide icons across both routes while standardizing the page width to the design tokens.

## 2025-09-02 13:15:48 IST
- Restyled the editor toolbar groups to remove pill backgrounds, tighten icon spacing, and rely on dividers for separation.
- Updated the toolbar layout to eliminate inter-group gaps while keeping vertical dividers between all control clusters.

## 2025-09-03 22:28:05 IST
- Simplified the editor toolbar layout so undo and redo stay in the main action row across breakpoints.
- Swapped the divider beside undo/redo to the vertical variant for consistent alignment with other controls.

## 2025-09-05 00:41:08 IST
- Moved the operational health dashboard to the `/health` route while preserving existing tooling.
- Replaced the home route with a minimal "Hello world" landing view.
- Added navigation from the health dashboard back to the new home page to keep routes discoverable.

## 2025-09-06 11:47:52 IST
- Reworked the editor toolbar layout to keep control groups scrollable and aligned while remaining responsive across breakpoints.
- Added a directional option to the toolbar divider so it can render horizontal separators when the action row stacks.

## 2025-09-06 18:52:16 IST
- Adjusted the shared editor toolbar groups to prevent shrinking and keep controls readable across breakpoints.
- Updated the toolbar layout so undo and redo actions wrap naturally on narrow screens, fixing alignment issues on the theme reference page.

## 2025-09-08 07:17:20 IST
- Added a token-driven switch component to the shared UI primitives for consistent theme toggles.
- Updated the theme reference page with a dark mode control and refreshed documentation to highlight reviewing tokens across modes.

## 2025-09-10 18:19:50 IST
- Added a `/theme` routed page composed from shared UI primitives to showcase typography, tokens, and button variants.
- Wired the main router and dashboard header link so the theme reference is reachable from the app shell and direct URLs.
- Documented the style guide location for contributors in `reference/theme-reference.md`.

## 2025-09-11 12:50:39 IST
- Fix Vite JSX scan error by renaming `client/src/hooks/useTheme.js` to `client/src/hooks/useTheme.jsx` to comply with repo standard of using `.jsx` for files containing JSX.
- Verified imports remain extensionless (`useTheme`) so no changes were required elsewhere.

## 2025-09-12 07:40:02 IST
- Added a reusable theme provider and hook to persist light/dark mode preferences across sessions and respect OS defaults.
- Wrapped the React app with the new theme context so the `.dark` class propagates to all routes.
- Introduced a dashboard toggle control that lets operators switch between design tokens for light and dark presentations.

## 2025-09-16 23:02:46 IST
## 2025-09-17 04:06:35 IST
- Standardized client file naming:
  - Renamed UI primitives to PascalCase: `client/src/components/ui/Button.jsx`, `client/src/components/ui/Card.jsx` and updated all imports.
  - Renamed router config to `client/src/app/router/AppRoutes.jsx` and updated `client/src/app/App.jsx` import.
  - Moved Axios base client to `client/src/api/client.js` per architecture guidelines.
- Verified a clean production build via Vite after changes.

- Replaced the button component with the shadcn-style variant API backed by design tokens.
- Added story coverage for each button variant to guard the public API.
- Documented the new class variance authority dependency for consistent styling tokens.

# Changelog

## 2025-09-19 01:43:50 IST
- Added a reusable Tiptap SimpleEditor with Lucide-powered toolbar actions aligned to shadcn button variants.
- Introduced `.prose` typography styles and exports for consistent read-only evidence rendering.
- Updated frontend dependencies to include required Tiptap extensions and React bindings.

## 2025-09-19 05:44:22 IST
- Added font and spacing design tokens to `client/src/styles/theme.css` and wired Tailwind to consume them via CSS variables.
- Replaced hard-coded spacing utilities in health dashboard, email tester, and MinIO upload UI with token-based classes.

## 2025-09-20 18:20:25 IST
- Enabled React Router v7 future flags (`v7_startTransition`, `v7_relativeSplatPath`) in `client/src/main.jsx` to silence console warnings and align behavior with upcoming v7 changes.

## 2025-09-21 18:02:43 IST
- Fix React production build configuration: added `__DEV__` and `process.env.NODE_ENV` defines in Vite to ensure dead‑code elimination and resolve the runtime error: "React is running in production mode, but dead code elimination has not been applied".
- Documented the React production build note in deployment guide.

## 2025-10-24 18:45 IST
- Centralized the frontend theme with shared CSS tokens, Tailwind color mappings, and refreshed UI components.


## 2025-10-24 17:30 IST
- Removed MinIO CORS policy validation from health checks and dashboard to avoid unnecessary alerts.

## 2025-10-24 16:05 IST
- Expanded health API to include latency, environment metadata, DNS checks, CPU/memory/disk metrics, and build timestamp support.
- Added database connection/query, MinIO connection/bucket/CORS, email server, and DNS diagnostics to health payload.
- Updated React health dashboard to visualize new health checks while preserving existing MinIO upload and email tools.

## 2025-09-22 22:45:02 IST
- Added typography utility classes in the global stylesheet to centralize headings, body text, and muted tones.
- Refactored app and health dashboard copy to reuse the shared typography scale.
- Documented the new utility classes in `global.css` for future contributors.

## 2025-10-24 14:45 IST
- Separated MinIO CORS validation into its own health indicator with detailed origin visibility in the dashboard.
- Enhanced health API to return configured and expected CORS origins independently from MinIO bucket status.

## 2025-10-24 13:20 IST
- Removed `API_PREFIX` from environment; server now uses fixed `/api` base path.
- Updated server env validation, route mounting, and logs to drop `API_PREFIX`.
- Ensured CORS uses comma-separated `CORS_ALLOWED_ORIGINS` (parsed into an allowlist).
- Updated documentation to reflect fixed `/api` base path and removed variable.
- Adjusted tests to align with new configuration. All tests pass.
- Updated `.env` and `.env.example` so `VITE_API_URL` does not include `/api` to avoid double prefix (client uses `/api/...` in request paths).

## 2025-10-24 13:44 IST
- Removed MinIO CORS validation from the health check and dashboard to avoid incorrect warnings.

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
## 2025-09-29 08:39:12 IST
- Removed the "System" eyebrow label from the Theme & Tokens page header to simplify the section presentation.

## 2025-09-29 08:56:07 IST
- Removed custom `client/src/styles/prose.css` and its import from `client/src/styles/global.css` to rely solely on Tailwind.
- Added `@tailwindcss/typography` and wired it in `client/tailwind.config.js` with brand token mappings for light/dark modes.
- Kept existing `.prose` usages (editor, Prose component) working via Tailwind Typography; removed bespoke CSS.

## 2025-09-29 09:52:17 IST
- Updated the Platform Health header icon to use the primary color for consistency with design guidelines.
## 2025-09-29 15:27:06 IST
- Added a new Dashboard feature module under `client/src/features/dashboard` with subfolders for components, data, and hooks; ported example pieces (AppSidebar, SiteHeader, SectionCards, ChartAreaInteractive, DataTable) and mapped imports to the `@/` alias.
- Moved `dashboard/data.json` into `client/src/features/dashboard/data/data.json` and exposed a `useDashboardData` hook to supply rows to the table.
- Recreated sidebar/header primitives using the existing UI kit and Tailwind tokens instead of Next.js/shadcn registry utilities; implemented a simplified responsive sidebar and chart.
- Added `client/src/app/layout/DashboardLayout.jsx` to wire the sidebar/header using React state persisted to `localStorage` in place of Next.js cookies.
- Implemented `client/src/app/pages/DashboardPage.jsx` composing cards, chart, and table with data from the new feature.
- Registered a `dashboard` route in `client/src/app/router/routes.jsx`, wrapped it in `DashboardLayout`, and added a `Dashboard` link in `MainLayout.jsx`.
- Installed `recharts` and verified a production Vite build to ensure the page compiles and renders in the client.
## 2025-09-30 11:16:07 IST
- Fixed Button `asChild` prop handling in `client/src/components/ui/button.jsx`: implemented child-clone rendering and stopped forwarding `asChild` to DOM elements. This removes the React warning and correctly styles anchor/Link elements as buttons (e.g., GitHub link in `client/src/components/ui/SiteHeader.jsx:29`).

## 2025-10-03 05:47:27 IST
- Simplified the client theme to the stock shadcn/ui token set, updating Tailwind config, global styles, and shared UI primitives to remove custom spacing and color ramps.
- Refactored health dashboards, theme documentation, and shared components to use standard Tailwind utilities and the streamlined token exports.

## 2025-10-08 01:27:17 IST
- Removed `client/src/styles/global.css`, folding the Tailwind base layers into `theme.css` and updating the client entrypoint and documentation to reference the consolidated stylesheet.

## 2025-10-11 03:59:47 IST
- Removed the `/theme`, `/dashboard`, and `/health` routes from the client router and deleted their page components.
- Deleted client feature modules for Dashboard (`client/src/features/dashboard`), Health (`client/src/features/health`), and Theme (`client/src/features/theme`).
- Refactored `client/src/main.jsx` to remove the ThemeProvider wrapper and updated the header to drop the theme toggle.
- Updated `client/src/components/ui/ThemeToggleCard.jsx` to self-manage theme locally without the feature provider.
- Removed the server health endpoint by deleting `server/src/modules/health` and its test, and unmounting the route in `server/src/app.js`.
- Cleaned up the AppSidebar to drop the Dashboard link and simplified header title logic accordingly.

## 2025-10-12 07:15:21 IST
- Removed unused client components and files to streamline the bundle while preserving the editor module:
  - Deleted `client/src/components/ui/ThemeToggleCard.jsx`
  - Deleted `client/src/components/ui/input.jsx`
  - Deleted `client/src/components/ui/switch.jsx`
  - Deleted `client/src/components/ui/button.stories.jsx`
  - Deleted `client/src/lib/api-client.js`
  - Kept `client/src/components/editor/**` intact as requested

## 2025-10-13 11:30:43 IST
- Standardized `client/src/features/home` structure with `components/`, `hooks/`, `pages/`, `services/`, `store/`, `types/`, and `utils/` (empty folders kept with placeholders).
- Added `services/home.service.js` stub using the shared Axios client and documented the feature in `client/src/features/home/README.MD`.
- Updated feature barrel exports to include service re-exports; no functional changes to runtime behavior.

## 2025-10-13 17:40:38 IST
- Migrated `client/src/app/pages/HomePage.jsx` to `client/src/features/home/pages/HomePage.jsx` to align with feature-first structure.
- Updated router import in `client/src/app/router/AppRoutes.jsx:1` to reference the new path; adjusted HomePage’s feature imports to `from '..'`.

## 2025-10-18 15:32:32 IST
- Fixed Vite import path case for Button in `client/src/features/home/components/OnboardingCtaSection.jsx` to resolve the Pre-transform error caused by importing from `components/ui/Button` instead of `components/ui/button`.

## 2025-10-19 07:55:11 IST
- Migrated stylesheet from `client/src/styles/theme.css` to `client/src/global.css` to centralize global Tailwind layers and design tokens at the root of `src`.
- Updated client entry import in `client/src/main.jsx:5` to `import './global.css';` and removed the old file to avoid duplicate styling.

## 2025-10-20 09:45:45 IST
- Moved `client/src/global.css` to `client/src/styles/global.css` to keep all styles under the `styles/` directory per project conventions.
- Updated import in `client/src/main.jsx:5` to `import './styles/global.css';` and deleted the original file path.

## 2025-10-23 05:59:20 IST
- Converted the PDF helper scripts to shell wrappers that ensure Python 3 and ReportLab dependencies before invoking the Python implementations in `scripts/python/`.
- Updated usage documentation within the Python modules to reference the new `.sh` entry points and preserved the existing PDF generation logic.

## 2025-10-23 16:13:37 IST
- Migrated Axios base client from `client/src/api/client.js` to `client/lib/client.js` to align with shared library placement.
- Added a temporary re-export at `client/src/api/client.js` to avoid breaking existing imports during transition.
- Updated `client/src/features/home/services/home.service.js` to import from the new path.
- Updated documentation references in `client/src/features/home/README.MD` and `agents.md`.

## 2025-10-26 17:39:07 IST
- Installed the full Shadcn UI component suite in `client/src/components/ui` and added the supporting toast hook under `client/src/hooks/use-toast.js`.
- Added Radix UI, utility, and animation dependencies plus CLI metadata (`components.json`, `jsconfig.json`) to support the design system.
- Updated Tailwind configuration, button variants, and existing sidebar/header imports to align with the new component set.

## 2025-11-04 09:25:15 IST
- Replaced manual sidebar profile indicators in `client/src/components/ui/AppSidebar.jsx` with the shared Avatar component to align the user menu with the shadcn/ui design system and provide consistent fallbacks.

## 2025-11-04 12:47:32 IST
- Reorganized the design system into `client/src/features/design-system` with dedicated components, hooks, and utilities plus feature documentation.
- Updated routing to consume the feature barrel export and relocated complex demo configuration into the feature's utils folder.
- Restored the home feature mock data to `client/src/features/home/data.js` and removed the redundant `utils/homeData.js` file.

## 2025-11-05 18:54:58 IST
- Resolved Vite/esbuild JSX parse error by renaming `client/src/features/design-system/utils/component-demo.config.js` to `.jsx` and updating its import in `client/src/features/design-system/utils/componentRegistry.js`.
- Verified no other `.js` files contain JSX in the client source.

## 2025-11-08 03:34:38 IST
- Moved Axios base client from `client/lib/client.js` to `client/src/lib/client.js` to keep all client libraries within `src/`.
- Confirmed existing alias-based imports (`@/lib/client`) and re-export at `client/src/api/client.js` remain valid.
- Updated documentation references in `agents.md` and `client/src/features/home/README.MD`.

## 2025-11-08 11:09:58 IST
- Removed the transitional re-export file and folder `client/src/api/client.js` since all consumers use `@/lib/client`.
- Verified no code references remain to `@/api/*`; updated nothing else.

## 2025-11-08 22:14:33 IST
- Refactored `AppSidebar` to compose the official shadcn sidebar primitives while keeping the dashboard layout API intact and preserving the 18rem rail width.
- Added the shared `Sidebar` UI primitive set so future rails can reuse the same header, content, footer, and menu structure.

## 2025-11-10 03:14:49 IST
- Introduced a sidebar provider and collapsible icon variant that syncs with dashboard layout persistence, enabling desktop collapse and mobile overlays via `client/src/components/ui/sidebar.jsx` and `client/src/app/layout/DashboardLayout.jsx`.
- Updated `client/src/components/custom-ui/AppSidebar.jsx` and `SiteHeader.jsx` to consume the provider APIs so navigation labels hide in collapsed mode while the header trigger toggles both icon and off-canvas states.

## 2025-11-16 23:16:08 IST
- Removed unused duplicates of the shared utility and mobile hooks by deleting `client/src/lib/utils.js`, `client/src/shared/lib/client.js`, and `client/src/hooks/use-mobile.js` now that the shared implementations cover all consumers.

## 2025-11-17 00:38:41 IST
- Versioned the Express application under `/api` by updating the API mount prefix in `server/src/app.js` and aligning the startup log metadata in `server/src/index.js`.
- Relocated Swagger UI to `/api/docs` while updating the documented endpoint paths in `server/src/modules/email/email.router.js` and `server/src/modules/storage/storage.router.js` plus the default server URL in `server/src/config/swagger.js`.
- Refreshed developer guidance in `agents.md` to reference the new Swagger documentation path.

## 2025-11-17 11:22:28 IST
- Updated the global error and not-found screens to adopt the auth layout's centered presentation and consistent internal routing links.
- Adjusted the browser router configuration so unmatched paths bypass the default dashboard layout and render the standalone not-found experience.

## 2025-11-18 06:58:07 IST
- Introduced a shared `StatusPage` layout and updated the existing error and not-found experiences to reuse it for consistent styling and actions.
- Added dedicated routes and pages for 401, 403, 408, 500, and 503 error states so other features can link to purpose-built guidance and recovery actions.

## 2025-11-18 16:23:49 IST
- Relocated the centralized error handling utilities to `server/src/utils/errors.js` and updated all server imports and documentation references accordingly.

## 2025-11-19 23:02:04 IST
- Fixed a startup-breaking syntax error by closing the missing quote in `server/src/modules/email/email.router.js` for the centralized error handling import.
- Corrected `server/src/modules/health/controllers/health.controller.js` to import from `server/src/utils/errors` instead of a non-existent shared path, aligning with centralized error handling.

## 2025-11-20 11:48:29 IST
- Styled Swagger UI by serving `server/src/config/swagger.css` at `/api/docs/swagger.css` and linking it via `customCssUrl` so `/api/docs` uses the selected theme.

## 2025-11-20 15:21:16 IST
- Fixed the rich text editor crash by migrating to the `lowlight@3` API: create an instance via `createLowlight(common)` and pass it to TipTap’s `CodeBlockLowlight` extension to restore code block rendering.

## 2025-11-22 22:57:11 IST
- Fixed Rich Text Editor preview styling by adding `@tailwindcss/typography` and enabling `prose` classes so headings (H1–H3), ordered/bulleted lists, blockquotes, and code blocks render correctly in the Design System page.

## 2025-11-26 18:21:13 IST
- Matched heights for admin user table toolbar controls by forcing `h-8` with `py-0` on the search input and both filter selects, and centering the filter group row so the search, dropdowns, and buttons align perfectly.

## 2025-11-29 09:48:50 IST
- Reduced toolbar width and fixed alignment on the admin user table by switching “Customize Columns” and “Clear filters” to icon-only buttons and resizing the refresh button to `icon-sm` so all controls share the same height.

## 2025-11-30 16:06:18 IST
- Aligned the admin user table toolbar width with the table by removing duplicated horizontal padding from the toolbar and shared data table header/toolbar wrappers.

## 2025-10-25 06:12:22 IST
- Unified the health and theme single pages behind a shared layout shell with a centralized header that links back home.
- Matched typography, button variants, and Lucide icons across both routes while standardizing the page width to the design tokens.

## 2025-10-25 06:07:46 IST
- Restyled the editor toolbar groups to remove pill backgrounds, tighten icon spacing, and rely on dividers for separation.
- Updated the toolbar layout to eliminate inter-group gaps while keeping vertical dividers between all control clusters.

## 2025-10-25 05:37:13 IST
- Simplified the editor toolbar layout so undo and redo stay in the main action row across breakpoints.
- Swapped the divider beside undo/redo to the vertical variant for consistent alignment with other controls.

## 2025-10-25 05:31:35 IST
- Moved the operational health dashboard to the `/health` route while preserving existing tooling.
- Replaced the home route with a minimal "Hello world" landing view.
- Added navigation from the health dashboard back to the new home page to keep routes discoverable.

## 2025-10-25 05:23:48 IST
- Reworked the editor toolbar layout to keep control groups scrollable and aligned while remaining responsive across breakpoints.
- Added a directional option to the toolbar divider so it can render horizontal separators when the action row stacks.

## 2025-10-25 05:00:34 IST
- Adjusted the shared editor toolbar groups to prevent shrinking and keep controls readable across breakpoints.
- Updated the toolbar layout so undo and redo actions wrap naturally on narrow screens, fixing alignment issues on the theme reference page.

## 2025-10-25 07:10:00 IST
- Added a token-driven switch component to the shared UI primitives for consistent theme toggles.
- Updated the theme reference page with a dark mode control and refreshed documentation to highlight reviewing tokens across modes.

## 2025-10-25 03:53:04 IST
- Added a `/theme` routed page composed from shared UI primitives to showcase typography, tokens, and button variants.
- Wired the main router and dashboard header link so the theme reference is reachable from the app shell and direct URLs.
- Documented the style guide location for contributors in `reference/theme-reference.md`.

## 2025-10-25 03:42:06 IST
- Fix Vite JSX scan error by renaming `client/src/hooks/useTheme.js` to `client/src/hooks/useTheme.jsx` to comply with repo standard of using `.jsx` for files containing JSX.
- Verified imports remain extensionless (`useTheme`) so no changes were required elsewhere.

## 2025-10-25 05:15:00 IST
- Added a reusable theme provider and hook to persist light/dark mode preferences across sessions and respect OS defaults.
- Wrapped the React app with the new theme context so the `.dark` class propagates to all routes.
- Introduced a dashboard toggle control that lets operators switch between design tokens for light and dark presentations.

## 2025-10-24 17:30:00 IST
- Replaced the button component with the shadcn-style variant API backed by design tokens.
- Added story coverage for each button variant to guard the public API.
- Documented the new class variance authority dependency for consistent styling tokens.

# Changelog

## 2025-10-25 03:25:12 IST
- Added a reusable Tiptap SimpleEditor with Lucide-powered toolbar actions aligned to shadcn button variants.
- Introduced `.prose` typography styles and exports for consistent read-only evidence rendering.
- Updated frontend dependencies to include required Tiptap extensions and React bindings.

## 2025-10-25 02:22:19 IST
- Added font and spacing design tokens to `client/src/styles/theme.css` and wired Tailwind to consume them via CSS variables.
- Replaced hard-coded spacing utilities in health dashboard, email tester, and MinIO upload UI with token-based classes.

## 2025-10-25 01:45:00 IST
- Enabled React Router v7 future flags (`v7_startTransition`, `v7_relativeSplatPath`) in `client/src/main.jsx` to silence console warnings and align behavior with upcoming v7 changes.

## 2025-10-24 23:20:00 IST
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

## 2025-10-24 15:10:00 IST
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

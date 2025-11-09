# Frontend Feature Development Guide

This guide explains how to build new user-facing capabilities inside the Vite + React client. Follow these conventions to keep every feature coherent with the rest of the application.

## 1. Kickstarting Feature Work

1. Install dependencies and launch the dev server from the `client/` workspace:
   ```bash
   cd client
   npm install
   npm run dev
   ```
   Vite reads optional environment toggles such as `CLIENT_PORT`, `CLIENT_ALLOWED_HOSTS`, and `CLIENT_USE_SECURE_HMR` from your shell when it assembles the dev server configuration (`vite.config.js`).
2. Supply frontend environment variables through a `.env` file or your shell. All values that must reach the browser **have to be prefixed with `VITE_`**, e.g. `VITE_API_URL`, to satisfy the Vite exposure rules. Important: set `VITE_API_URL` to the server base URL only (e.g. `http://localhost:5000`) — do not include `/api` because client requests already use paths like `/api/auth/...`. Logging verbosity comes from `VITE_LOG_LEVEL` and defaults to `debug` during development.
3. Implement your UI inside a feature module under `client/src/features`. Export the entry points (pages, hooks, route objects) from the feature’s `index.js` so they can be pulled into the application router (`client/src/app/routes.jsx`).
4. Register your new page or route by extending the `createBrowserRouter` structure in `client/src/app/routes.jsx`. Most features nest inside the default layout alongside the existing home and health routes.
5. Reuse shared primitives from `client/src/shared`—especially API clients (`client/src/shared/lib/client.js`), layout chrome, logging helpers, and authentication flows—before adding new dependencies.

> **Logging location:** When the client runs inside Docker, service logs are forwarded into `client/logs/` (mounted to `/app/logs`), mirroring the backend convention. Keep this directory out of Git just like the server logs.

### Auth and API client behavior

- The shared Axios client automatically attaches the `Authorization: Bearer <accessToken>` header from `localStorage`.
- On `401 Unauthorized` responses (except for `/api/auth/login|refresh|logout`), it silently attempts a single token refresh via `POST /api/auth/refresh` using the stored `refreshToken`, then retries the original request.
- On successful refresh, it updates `localStorage` (`accessToken`, `refreshToken`, and `user` when present) and dispatches a `px:user-updated` event on `window` so listeners can react.
- If refresh fails or no `refreshToken` is available, it clears local auth state (`accessToken`, `refreshToken`, `user`) and leaves the original `401` to bubble up. Route guards will redirect unauthenticated sessions back to the login page.

This behavior keeps protected screens responsive during normal access token expiry without interrupting users or dropping in-flight actions.

## 2. Feature Folder Anatomy

Every folder under `client/src/features` represents a self-contained feature slice. Use the existing modules as references:

- **`pages/`** — top-level route components (e.g. `HomePage.jsx`, `LoginPage.jsx`, `HealthPage.jsx`).
- **`components/`** — reusable, feature-specific view components (e.g. the home overview summary cards + review queue panel that reuse `useGovernanceOverview`, the auth layout wrapper).
- **`hooks/`** — React hooks that encapsulate data fetching or state logic (e.g. `health/hooks/useHealthStatus.js`).
- **`routes.jsx`** — optional router configuration exported as part of the feature (used by the auth stack to provide nested routes and layout composition).
- **`index.js`** — the module surface that re-exports pages, hooks, and route definitions for easy import elsewhere.

When you add a new feature, mirror this layout: create `pages/` for route components, keep `components/` for subviews, and expose your public API via `index.js`. Stick with `@/` path aliases (configured via `client/jsconfig.json` and wired by `vite-tsconfig-paths` in `client/vite.config.js`) to avoid brittle relative paths.

### Admin feature module

The administrator experience follows a nested module layout so we can grow isolated dashboards without polluting the shared namespace. All admin routes live under `client/src/features/admin/` and break down into three domains:

- `design-system/` — houses the design system showcases split into `components/`, `hooks/`, and `pages/` (`DesignSystemShowcase.jsx`, `useDesignSystem.js`, `DesignSystemPage.jsx`).
- `health/` — contains the system health UI, including reusable cards (`components/`), the polling hook (`hooks/useHealthStatus.js`), and the route wrapper under `pages/HealthPage.jsx`.
- `user-management/` — encapsulates the directory, reports, and audit tooling with dedicated folders for charts, stats, tabs, table helpers, and domain hooks. Tests that exercise this slice live alongside the shared Vitest suites in `client/tests/`.

The feature surface (`client/src/features/admin/index.js`) re-exports the admin routes plus the key hooks (`useDesignSystem`, `useHealthStatus`, `useAdminUsers`, `useAuditLogs`, `useClientRuntimeMetrics`) so other parts of the app can opt into admin behavior without reaching into private folders.

Use `client/src/shared/components/guards/RequirePermission.jsx` to protect admin routes that rely on RBAC checks; the guard defers to the backend's Casbin evaluator and accepts optional `allowRoles` overrides for privileged roles.

### Probe Management feature

Probe operations (registry, deployments, schedules, and health) live in `client/src/features/probes/`. The module mirrors the server spec with:

- `api/probesClient.js` to wrap `/api/probes` endpoints via the shared Axios client.
- Hooks such as `useProbeRegistry`, `useProbeDeployments`, and `useProbeMetrics` that normalise API payloads for the UI.
- Pages (`ProbeRegistryPage.jsx`, `ProbeDeploymentPage.jsx`, `ProbeSchedulePage.jsx`, `ProbeHealthDashboard.jsx`) registered through `features/probes/routes.jsx` and guarded with `<RequirePermission>` so only authorised roles see them.

Add new UI flows by extending the hooks/components inside this feature before reaching for cross-cutting state.

### Check Management feature

Governance dashboards for check definitions, review queues, and result exploration live in `client/src/features/governance/`. The module follows the same slice conventions:

- `checks/api/checksClient.js` centralises access to `/api/governance/*` so catalog views, queue drawers, and explorers all reuse the same Axios instance.
- Hooks such as `useCheckDefinitions`, `useReviewQueue`, and `useCheckResults` manage filters, pagination, optimistic updates, and toast-friendly error states. They also expose helpers for activating checks, running ad-hoc executions, and completing review tasks.
- UI is split across `GovernanceOverviewPage`, `CheckCatalogPage`, `ReviewQueuePage`, and `ResultExplorerPage`, each registered via `features/governance/routes.jsx` and gated with `<RequirePermission>` for the new `governance:*` resources.
- Reusable components (`CheckDefinitionForm`, `ReviewTaskDrawer`, `ResultTimeline`, `ControlCoverageChart`) handle the heavier UX (forms, drawers, charts) so future check types can plug into the same primitives.

When you add new governance flows, extend these hooks/components first, keep API access inside `checksClient`, and mirror any permission or lifecycle additions in the RBAC documentation under `docs/05-user-guides/02-rbac.md`.

### Control Management feature

Control governance UI now lives at `client/src/features/governance/controls/` alongside the existing check dashboards:

- `controls/api/controlsClient.js` fans out to `/api/governance/controls` for catalog reads, CRUD, mapping updates, remediation triggers, and score history so every page uses the same Axios helpers.
- Hooks (`useControls`, `useControlMappings`, `useControlScores`) own list filters, selection state, mapping persistence, and score polling logic. They expose helpers for archiving, swapping mappings, and launching remediation workflows so the catalog, detail, and scoreboard views never duplicate fetch code.
- Components split responsibilities: `ControlCatalogTable`, `ControlForm`, `ControlDetailPanel`, `MappingMatrix`, `ScoreTrendChart`, and `RemediationTaskList` compose the catalog/dashboard, while `FrameworkCoverageHeatmap` (under `client/src/components/governance/`) visualises coverage across frameworks.
- Routes were added to `features/governance/routes.jsx` for `/governance` (overview), `/governance/controls`, `/:controlId`, `/:controlId/mappings`, and `/controls/scoreboard`, all wrapped with `<RequirePermission>` for the appropriate governance resources (`governance:overview`, `governance:controls*`) so RBAC drives visibility.

When you extend control workflows (e.g., new coverage badges, remediation UX, or score visualisations), update the hooks/components above instead of re-implementing state in pages. Keep new API calls inside `controlsClient` and ensure any RBAC/resource changes align with the backend router.

### Task Management feature

Remediation UI lives in `client/src/features/tasks/` and mirrors the backend task module:

- `api/tasks-client.js` fronts `/api/tasks` while hooks such as `useTaskInbox`, `useTaskDetail`, `useTaskMutations`, and `useSlaMetrics` encapsulate fetching, pagination, optimistic updates, and SLA polling. Import these hooks anywhere you need task state instead of wiring Axios manually.
- Components (`TaskForm`, `TaskTimeline`, `EvidenceAttachmentList`, `EscalationBanner`, `ExternalSyncStatus`) power the inbox, board, and detail pages. Keep new remediation widgets here so other governance screens can reuse them without diving into page-level code.
- Pages (`TaskInboxPage`, `TaskBoardPage`, `TaskDetailPage`) register their routes via `features/tasks/routes.jsx`. The board uses `@dnd-kit/core` to support drag-and-drop lifecycle transitions, while the detail page composes the evidence list, timeline, and integration status cards.
- Shared governance components (e.g., `@/components/governance/TaskControlPanel`) surface metrics for dashboards and the inbox. Update them alongside the hooks whenever you add new SLA summaries or escalation visuals.

Remember to wrap pages with `<RequirePermission>` inside `tasksRoutes` so RBAC matches the backend router (`tasks:records`, `tasks:assignments`, `tasks:evidence`, `tasks:metrics`, `tasks:integrations`). Update this section plus `docs/03-systems/13-task-management-system/readme.md` when the remediation UI workflows evolve.

### Dashboards & reporting feature

The `/api/reports` experience lives in `client/src/features/dashboards/` and follows the same feature-slice conventions:

- `api/reportsClient.js` centralizes every reporting request (four dashboard GETs plus the export CRUD helpers). Import from here instead of calling Axios directly so interceptors keep auth tokens in sync.
- Hooks (`useFrameworkScores`, `useControlMetrics`, `useRemediationMetrics`, `useEvidenceMetrics`, `useReportExport`) expose `{ data, isLoading, error, refresh, setFilters }` so route components remain declarative. When you add a new dashboard, create a hook first so filters/polling stay reusable.
- Components (`ScoreGauge`, `ControlHeatmap`, `RemediationTrendChart`, `EvidenceFreshnessTable`) encapsulate the heavier chart/table UIs and can be embedded in other features that need reporting snippets.
- Pages live under `pages/` (`FrameworkScoresPage.jsx`, `ControlHealthPage.jsx`, `RemediationDashboardPage.jsx`, `EvidenceCoveragePage.jsx`) and register via `dashboardsRoutes`. Each route is wrapped with `<RequirePermission resource=\"reports:dashboards\">` to mirror the backend policy.
- Cross-feature UI such as the export scheduler dialog sits in `client/src/components/reports/ExportSchedulerModal.jsx` so governance/tasks pages can launch reporting exports without duplicating markup.

Whenever you add new reporting surfaces, extend the shared client + hook first, then register the route and update the sidebar/nav config (`client/src/shared/components/app-sidebar.jsx`) so operators can discover the page.

### Framework Mapping feature

Framework lifecycle management sits in `client/src/features/frameworks/` and mirrors the backend spec:

- `api/frameworks-client.js` fronts `/api/frameworks` and its nested routes so the catalog, detail, mapping matrix, and version history pages share the same Axios calls.
- Hooks:
  - `use-frameworks.js` powers the catalog with filters, pagination, and creation/update helpers.
  - `use-framework-mappings.js` streams mapping lists, strength summaries, and coverage matrices for the mapping editor.
  - `use-framework-versions.js` loads semantic versions and exposes the creation helper used by the history page.
- Components such as `framework-form.jsx`, `control-list.jsx`, `mapping-editor.jsx`, and `version-diff-viewer.jsx` keep the heavy UI logic reusable across pages. Common visuals (e.g., the coverage matrix) live under `client/src/components/governance/`.
- Routes are registered via `features/frameworks/routes.jsx` and gated with `<RequirePermission>` for `frameworks:*` resources so navigation hides automatically when RBAC denies access.

When you introduce new mapping workflows or diff visualisations, extend these hooks/components rather than introducing new global state; keep saved views/signals wired through the shared hooks so the catalog, mapping page, and version diff stay in sync.

### Evidence Management feature

Evidence workflows live under `client/src/features/evidence/` and reuse the shared API client + hooks pattern:

- `routes.jsx` exports the library, upload, detail, and retention routes so `client/src/app/routes.jsx` can simply spread `evidenceRoutes` into the protected layout.
- `api/evidenceClient.js` wraps every `/api/evidence` operation (list, upload, metadata, links, retention) while `useEvidenceLibrary`, `useEvidenceUpload`, and `useEvidenceRetention` own the derived state, pagination, and mutation helpers consumed by their respective pages.
- Components such as `EvidenceUploadWizard`, `EvidenceMetadataPanel`, `EvidenceDownloadButton`, and `EvidenceLinkingForm` compose the heavy UX for upload and detail screens. The shared `client/src/components/governance/EvidenceTimeline.jsx` renders the event ledger so any future drawers or dashboards can visualise the same history payload.

When adding new evidence filters, retention states, or UI surfaces, extend these hooks/components and keep API calls inside `api/evidenceClient.js`. Update `docs/03-systems/11-evidence-management-system/readme.md` alongside UI changes so the reference stays accurate.

## 3. Styling System

Tailwind CSS v4 powers all styling. The global stylesheet (`client/src/index.css`) imports the Tailwind base layers and centralizes the design tokens:

- The `@theme inline` block defines semantic CSS custom properties (`--color-primary`, `--radius-lg`, etc.) that Tailwind utilities can consume.
- Root-level and `.dark` variables declare light/dark palettes so your components inherit theme colors automatically.
- The `@layer base` section applies baseline typography and border rules, ensuring every element respects shared tokens.

Favor Tailwind utility classes in JSX and fall back to custom CSS variables only when a utility cannot express the design. If you need composable class strings, use the shared `cn` helper (`client/src/shared/lib/utils.js`) which wraps `clsx` and `tailwind-merge` to deduplicate classes.

### Layout and spacing

The protected layout defined in `client/src/app/layouts/DefaultLayout.jsx` now applies `px-4 lg:px-6` to the `main` wrapper and nests every route inside a centered `div` that caps the width at `max-w-screen-2xl`. This keeps the content width identical to `/admin/users` (and identical across every page) while still allowing per-section spacing inside individual pages. Status and error pages opt out of this layout stack and may handle their spacing independently.

## 4. shadcn/ui and Tailwind Components

The design system components are sourced from shadcn/ui and live under `client/src/shared/components/ui`. They are plain JavaScript files generated against the configuration in `client/components.json`, which:

- Sets the `@/shared/components` alias as the component root and exposes shared helpers via `@/shared/lib` and `@/shared/hooks`.
- Points Tailwind to `src/index.css` so every generated component reads the same design tokens.
- Uses the `lucide` icon library and the “new-york” theme preset, matching the rest of the UI.

To add another shadcn component, run `npx shadcn add <component>` inside `client/`. The generator respects the aliases above, so the new file will drop into `src/shared/components/ui`. After generation, review the markup and wiring so it aligns with feature-level conventions (props, naming, test IDs) before consuming it in your feature.

Because Tailwind runs through the official `@tailwindcss/vite` plugin (`vite.config.js`), any classes used in features or shared components are automatically discovered—no manual safelist configuration is necessary. Keep all component styles expressed as Tailwind utilities to benefit from this tooling pipeline.

## 5. Testing New Features

- Run `npm run test` to execute the Vitest suite configured with jsdom and Testing Library (see `client/tests/setup.js`).
- Co-locate component and hook specs near the code they exercise or under `client/tests` for cross-feature helpers.
- Prefer the shared logger (`client/src/shared/lib/logger.js`) in tests as well so log assertions align with production behaviour.

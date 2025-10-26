## 2025-10-26 20:35:33 IST
- Replaced relative client imports with the `@/` alias across home feature components, editor primitives, and router modules to standardize pathing.
- Updated the home feature README to reference the alias-based import pattern for future contributors.
- Confirmed the Vite alias configuration and IDE path mapping already point `@` to `client/src`.

## 2025-10-26 21:45:00 IST
- Moved the dashboard AppSidebar and SiteHeader components into `client/src/components/custom-ui/` and updated the layout to import them from their new location.

## 2025-10-26 20:04:44 IST
- Removed the design system feature bundle and its `/design-system` route to simplify the client build.

## 2025-10-26 09:37:21 IST
- Locked the dashboard shell to the viewport height, ensuring only the main content pane scrolls so routes like `/design-system` no longer trigger an extra page scrollbar.
- Forced `html`, `body`, and `#root` to span 100% height with the body set to `overflow-hidden` so the browser scrollbar stays disabled while nested layout panes handle scrolling.

## 2025-10-26 06:52:19 IST
- Restyled `client/src/components/ui/SiteHeader.jsx` with shadcn/ui primitives, introducing the icon toggle button, vertical separator, and block-aligned header text to match the dashboard shell reference.
## 2025-10-26 04:45:00 IST
- Reworked the home feature hero, navigation, checklist, knowledge, and onboarding sections to use shadcn/ui cards and buttons
  instead of bespoke Tailwind wrappers so the dashboard aligns with the shared component system.

## 2025-10-26 02:28:15 IST
- Matched the dashboard grid column width to the sidebar's 18rem rail so the header and sidebar borders align cleanly without overlap.

## 2025-10-25 16:30:00 IST
- Added a profile dropdown menu to the AppSidebar that mirrors the reference layout with account, billing, notifications, and logout actions.

## 2025-10-25 13:40:00 IST
- Tightened the AppSidebar layout to left-align navigation items, reduce vertical spacing, and lock the rail height without scroll to match design guidance.

## 2025-10-25 13:06:21 IST
- Inlined the single page layout shell within the home, health, and theme pages to remove the shared layout dependency.
- Deleted `client/src/app/layout/SinglePageLayout.jsx` after migrating each page to a self-contained structure with embedded headers.

## 2025-10-25 13:00:32 IST
- Relocated the dashboard AppSidebar and SiteHeader into `client/src/components/ui` so shared layouts consume the common shell primitives directly.

## 2025-10-25 13:55:00 IST
- Modularized the home overview into a dedicated `client/src/features/home` feature so the page composes reusable hero, navigation, checklist, and resource panels.

## 2025-10-25 13:45:00 IST
- Removed the unused `client/src/app/layout/MainLayout.jsx` shell now that every route renders through the dashboard layout components.

## 2025-10-25 12:30:01 IST
- Routed every client page through `client/src/app/layout/DashboardLayout.jsx`, refreshing the sidebar links and dashboard header so navigation stays consistent across routes.
- Reworked the home overview into card-driven sections that align with the dashboard shell for navigation, launch readiness, and resource discovery.

## 2025-10-25 09:58:48 IST
- Expanded the client color system with multi-step ramps, updated shared UI primitives to the refreshed semantic utilities, and refreshed the theme page and health dashboard styling for improved contrast in light and dark modes.

## 2025-10-25 09:47:56 IST
- Added sidebar and chart design tokens to the client theme and extended Tailwind utilities to surface the regenerated palette, including the updated radius scale.

## 2025-10-25 09:29:16 IST
- Updated client theme tokens to the Violet preset from shadcn/ui and aligned success, warning, and info semantics with the shared color palette.

## 2025-10-25 09:20:06 IST
- Rebuilt the home page shell to closely mirror the shadcn/ui sidebar-07 layout with a persistent left rail, breadcrumb header, and stacked content tiles ready for production data.
- Simplified hero content into structured placeholders so the visual hierarchy matches the provided dark dashboard reference.

## 2025-10-25 21:15:00 IST
- Reimagined the home dashboard with a sidebar inspired workspace, interactive trend chart, metrics, and screenshot gallery linking to shadcn/ui resources.

## 2025-10-25 20:45:00 IST
- Promoted the ThemeToggleCard into `client/src/components/ui` and updated the Theme and Health pages to import the shared component.
- Refreshed the theme feature docs and exports to reflect the new shared component location.

## 2025-10-25 08:20:35 IST
- Reorganized the client app structure with dedicated layout and router directories under `src/app` and moved the theme page into the consolidated pages module.
- Added a primary navigation layout shell and central route configuration to match the new folder hierarchy.
- Expanded the health feature with service and utility layers, refreshed exports, and documented the module boundaries.

## 2025-10-25 09:30:00 IST
- Restructured the theme feature into components, hooks, services, and utils folders with a documented README for future growth.
- Moved the theme provider, hook, and token exports to the new layout and updated pages to consume the aggregated feature API.

## 2025-10-25 07:27:04 IST
- Relocated the email connectivity test form into the health feature so the operational dashboard owns its tooling.

## 2025-10-25 06:58:25 IST
- Refactored the client routing to use dedicated home and health pages while keeping App.jsx focused on route definitions.
- Extracted the health dashboard theme toggle into a reusable component under the theme feature for reuse across pages.

## 2025-10-25 07:45:00 IST
- Moved the theme provider and hook into `client/src/features/theme` with shared token exports for future reuse.
- Updated the app shell to consume the new feature entry point and retired the legacy `/theme` reference route.


## 2025-10-25 06:24:59 IST
- Allowed editor toolbar groups to wrap on narrow screens while preserving single-row layout on larger viewports.

## 2025-10-25 08:55:00 IST
- Added Swagger UI under `/api/docs` and autogenerated OpenAPI specs from route annotations.
- Introduced CI check (`npm run openapi:check`) to ensure the spec builds successfully during test runs.
- Documented the new API documentation workflow in `docs/02-technical-specifications/02-backend-architecture-and-apis.md`.


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
## 2025-10-26 04:47:01 IST
- Standardized client file naming:
  - Renamed UI primitives to PascalCase: `client/src/components/ui/Button.jsx`, `client/src/components/ui/Card.jsx` and updated all imports.
  - Renamed router config to `client/src/app/router/AppRoutes.jsx` and updated `client/src/app/App.jsx` import.
  - Moved Axios base client to `client/src/api/client.js` per architecture guidelines.
- Verified a clean production build via Vite after changes.

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
## 2025-10-25 19:30:00 IST
- Removed the "System" eyebrow label from the Theme & Tokens page header to simplify the section presentation.

## 2025-10-25 19:05:00 IST
- Removed custom `client/src/styles/prose.css` and its import from `client/src/styles/global.css` to rely solely on Tailwind.
- Added `@tailwindcss/typography` and wired it in `client/tailwind.config.js` with brand token mappings for light/dark modes.
- Kept existing `.prose` usages (editor, Prose component) working via Tailwind Typography; removed bespoke CSS.

## 2025-10-25 20:00:00 IST
- Updated the Platform Health header icon to use the primary color for consistency with design guidelines.
## 2025-10-25 11:10:00 IST
- Added a new Dashboard feature module under `client/src/features/dashboard` with subfolders for components, data, and hooks; ported example pieces (AppSidebar, SiteHeader, SectionCards, ChartAreaInteractive, DataTable) and mapped imports to the `@/` alias.
- Moved `dashboard/data.json` into `client/src/features/dashboard/data/data.json` and exposed a `useDashboardData` hook to supply rows to the table.
- Recreated sidebar/header primitives using the existing UI kit and Tailwind tokens instead of Next.js/shadcn registry utilities; implemented a simplified responsive sidebar and chart.
- Added `client/src/app/layout/DashboardLayout.jsx` to wire the sidebar/header using React state persisted to `localStorage` in place of Next.js cookies.
- Implemented `client/src/app/pages/DashboardPage.jsx` composing cards, chart, and table with data from the new feature.
- Registered a `dashboard` route in `client/src/app/router/routes.jsx`, wrapped it in `DashboardLayout`, and added a `Dashboard` link in `MainLayout.jsx`.
- Installed `recharts` and verified a production Vite build to ensure the page compiles and renders in the client.
## 2025-10-26 01:52:20 IST
- Fixed Button `asChild` prop handling in `client/src/components/ui/button.jsx`: implemented child-clone rendering and stopped forwarding `asChild` to DOM elements. This removes the React warning and correctly styles anchor/Link elements as buttons (e.g., GitHub link in `client/src/components/ui/SiteHeader.jsx:29`).

## 2025-10-26 02:57:51 IST
- Simplified the client theme to the stock shadcn/ui token set, updating Tailwind config, global styles, and shared UI primitives to remove custom spacing and color ramps.
- Refactored health dashboards, theme documentation, and shared components to use standard Tailwind utilities and the streamlined token exports.

## 2025-10-26 03:30:00 IST
- Removed `client/src/styles/global.css`, folding the Tailwind base layers into `theme.css` and updating the client entrypoint and documentation to reference the consolidated stylesheet.
## 2025-10-26 04:20:00 IST
- Removed the `/theme`, `/dashboard`, and `/health` routes from the client router and deleted their page components.
- Deleted client feature modules for Dashboard (`client/src/features/dashboard`), Health (`client/src/features/health`), and Theme (`client/src/features/theme`).
- Refactored `client/src/main.jsx` to remove the ThemeProvider wrapper and updated the header to drop the theme toggle.
- Updated `client/src/components/ui/ThemeToggleCard.jsx` to self-manage theme locally without the feature provider.
- Removed the server health endpoint by deleting `server/src/modules/health` and its test, and unmounting the route in `server/src/app.js`.
- Cleaned up the AppSidebar to drop the Dashboard link and simplified header title logic accordingly.
## 2025-10-26 04:21:18 IST
- Removed unused client components and files to streamline the bundle while preserving the editor module:
  - Deleted `client/src/components/ui/ThemeToggleCard.jsx`
  - Deleted `client/src/components/ui/input.jsx`
  - Deleted `client/src/components/ui/switch.jsx`
  - Deleted `client/src/components/ui/button.stories.jsx`
  - Deleted `client/src/lib/api-client.js`
  - Kept `client/src/components/editor/**` intact as requested
## 2025-10-26 04:56:41 IST
- Standardized `client/src/features/home` structure with `components/`, `hooks/`, `pages/`, `services/`, `store/`, `types/`, and `utils/` (empty folders kept with placeholders).
- Added `services/home.service.js` stub using the shared Axios client and documented the feature in `client/src/features/home/README.MD`.
- Updated feature barrel exports to include service re-exports; no functional changes to runtime behavior.
## 2025-10-26 05:02:35 IST
- Migrated `client/src/app/pages/HomePage.jsx` to `client/src/features/home/pages/HomePage.jsx` to align with feature-first structure.
- Updated router import in `client/src/app/router/AppRoutes.jsx:1` to reference the new path; adjusted HomePage’s feature imports to `from '..'`.
## 2025-10-26 05:04:40 IST
- Fixed Vite import path case for Button in `client/src/features/home/components/OnboardingCtaSection.jsx` to resolve the Pre-transform error caused by importing from `components/ui/Button` instead of `components/ui/button`.
## 2025-10-26 05:20:00 IST
- Migrated stylesheet from `client/src/styles/theme.css` to `client/src/global.css` to centralize global Tailwind layers and design tokens at the root of `src`.
- Updated client entry import in `client/src/main.jsx:5` to `import './global.css';` and removed the old file to avoid duplicate styling.
## 2025-10-26 05:34:00 IST
- Moved `client/src/global.css` to `client/src/styles/global.css` to keep all styles under the `styles/` directory per project conventions.
- Updated import in `client/src/main.jsx:5` to `import './styles/global.css';` and deleted the original file path.
## 2025-10-26 05:34:20 IST
- Migrated Axios base client from `client/src/api/client.js` to `client/lib/client.js` to align with shared library placement.
- Added a temporary re-export at `client/src/api/client.js` to avoid breaking existing imports during transition.
- Updated `client/src/features/home/services/home.service.js` to import from the new path.
- Updated documentation references in `client/src/features/home/README.MD` and `agents.md`.
## 2025-10-26 06:29:41 IST
- Installed the full Shadcn UI component suite in `client/src/components/ui` and added the supporting toast hook under `client/src/hooks/use-toast.js`.
- Added Radix UI, utility, and animation dependencies plus CLI metadata (`components.json`, `jsconfig.json`) to support the design system.
- Updated Tailwind configuration, button variants, and existing sidebar/header imports to align with the new component set.
## 2025-10-26 06:55:00 IST
- Replaced manual sidebar profile indicators in `client/src/components/ui/AppSidebar.jsx` with the shared Avatar component to align the user menu with the shadcn/ui design system and provide consistent fallbacks.
## 2025-10-26 07:46:14 IST
- Reorganized the design system into `client/src/features/design-system` with dedicated components, hooks, and utilities plus feature documentation.
- Updated routing to consume the feature barrel export and relocated complex demo configuration into the feature's utils folder.
- Restored the home feature mock data to `client/src/features/home/data.js` and removed the redundant `utils/homeData.js` file.
## 2025-10-26 08:05:00 IST
- Resolved Vite/esbuild JSX parse error by renaming `client/src/features/design-system/utils/component-demo.config.js` to `.jsx` and updating its import in `client/src/features/design-system/utils/componentRegistry.js`.
- Verified no other `.js` files contain JSX in the client source.
## 2025-10-27 00:11:03 IST
- Moved Axios base client from `client/lib/client.js` to `client/src/lib/client.js` to keep all client libraries within `src/`.
- Confirmed existing alias-based imports (`@/lib/client`) and re-export at `client/src/api/client.js` remain valid.
- Updated documentation references in `agents.md` and `client/src/features/home/README.MD`.
## 2025-10-27 00:16:19 IST
- Removed the transitional re-export file and folder `client/src/api/client.js` since all consumers use `@/lib/client`.
- Verified no code references remain to `@/api/*`; updated nothing else.

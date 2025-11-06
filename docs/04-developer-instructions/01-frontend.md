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
- **`components/`** — reusable, feature-specific view components (e.g. the home dashboard charts, the auth layout wrapper).
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

## 3. Styling System

Tailwind CSS v4 powers all styling. The global stylesheet (`client/src/index.css`) imports the Tailwind base layers and centralizes the design tokens:

- The `@theme inline` block defines semantic CSS custom properties (`--color-primary`, `--radius-lg`, etc.) that Tailwind utilities can consume.
- Root-level and `.dark` variables declare light/dark palettes so your components inherit theme colors automatically.
- The `@layer base` section applies baseline typography and border rules, ensuring every element respects shared tokens.

Favor Tailwind utility classes in JSX and fall back to custom CSS variables only when a utility cannot express the design. If you need composable class strings, use the shared `cn` helper (`client/src/shared/lib/utils.js`) which wraps `clsx` and `tailwind-merge` to deduplicate classes.

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

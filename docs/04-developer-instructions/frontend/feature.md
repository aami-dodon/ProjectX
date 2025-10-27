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
2. Supply frontend environment variables through a `.env` file or your shell. All values that must reach the browser **have to be prefixed with `VITE_`**, e.g. `VITE_API_BASE_URL`, to satisfy the Vite exposure rules described in the root `agents.md` brief.
3. Implement your UI inside a feature module under `client/src/features`. Export the entry points (pages, hooks, route objects) from the feature’s `index.js` so they can be pulled into the application router (`client/src/app/routes.jsx`).
4. Register your new page or route by extending the `createBrowserRouter` structure in `client/src/app/routes.jsx`. Most features nest inside the default layout alongside the existing home and health routes.
5. Reuse shared primitives from `client/src/shared`—especially API clients, layout chrome, and authentication flows—before adding new dependencies.

## 2. Feature Folder Anatomy

Every folder under `client/src/features` represents a self-contained feature slice. Use the existing modules as references:

- **`pages/`** — top-level route components (e.g. `HomePage.jsx`, `LoginPage.jsx`, `HealthPage.jsx`).
- **`components/`** — reusable, feature-specific view components (e.g. the home dashboard charts, the auth layout wrapper).
- **`hooks/`** — React hooks that encapsulate data fetching or state logic (e.g. `health/hooks/useHealthStatus.js`).
- **`routes.jsx`** — optional router configuration exported as part of the feature (used by the auth stack to provide nested routes and layout composition).
- **`index.js`** — the module surface that re-exports pages, hooks, and route definitions for easy import elsewhere.

When you add a new feature, mirror this layout: create `pages/` for route components, keep `components/` for subviews, and expose your public API via `index.js`. Stick with `@/` path aliases (configured in `client/jsconfig.json`) to avoid brittle relative paths.

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

# Home Feature

Purpose
- Provides the landing experience composed from reusable UI sections.
- Implements a clean separation between presentational components (under `components/`) and future logic layers (`hooks/`, `services/`, `store/`, `utils/`).

Structure
- `components/` – Reusable UI for hero, navigation, checklist, knowledge grid.
- `hooks/` – Custom hooks for this feature (data fetching, local state).
- `pages/` – Route-level components specific to the feature (unused for now; kept for consistency).
- `services/` – API calls and side-effecting logic using `client/lib/client.js`.
- `store/` – Optional state management (Redux/Zustand), scoped to this feature.
- `types/` – Use JSDoc typedefs (no TypeScript per project guidelines).
- `utils/` – Pure helpers (formatting, mapping, guards) used by this feature.
- `index.js` – Barrel exports for convenient imports.

Usage
- Import sections directly from the feature barrel:
  - `import { HomeHeroSection } from "../../features/home";`
- Add API calls in `services/home.service.js` and consume them via hooks.

UI & Styling
- Follow the design tokens and conventions in `reference/ui-reference.md`.
- Use Tailwind utilities aligned to the project’s CSS variables.

Notes
- This module is JavaScript-only. Prefer JSDoc for type hints.
- Empty folders are intentionally kept for future growth.

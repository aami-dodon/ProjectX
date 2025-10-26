# Design System Feature

## Overview
The design system feature exposes an interactive explorer that automatically surfaces every UI component from `client/src/components/ui`. It enables designers and developers to review variants, verify theme tokens, and preview components across light and dark modes.

## Key Capabilities
- **Automatic discovery** of UI modules using `import.meta.glob`.
- **Variant previews** generated from each component's exported variant helpers.
- **Live theme editing** via CSS custom property color pickers.
- **Mode switching** for light and dark tokens.
- **Demo overrides** powered by `component-demo.config.js` for complex components.

## Directory Structure
```
components/  # Presentational building blocks for the explorer UI.
hooks/       # Reusable logic for theme state and component discovery.
pages/       # Route-level pages rendered by React Router.
services/    # Reserved for API calls or domain logic (unused currently).
store/       # Reserved for state containers (unused currently).
types/       # Reserved for shared typedefs (unused currently).
utils/       # Helper utilities such as demo configs and formatting helpers.
```

## Usage
Import the route-level component from the feature barrel:

```js
import { DesignSystemPage } from '@/features/design-system';
```

The page is registered under the `/design-system` path and wrapped with the shared `DashboardLayout`.

## Theming Notes
- Color inputs write directly to the root CSS variables (`--primary`, `--accent`, etc.).
- Switching between light and dark modes toggles the `dark` class on `<html>` and reapplies the persisted token values.
- Additional tokens can be added by extending `COLOR_TOKENS` in `utils/themeTokens.js`.

## Extending Component Demos
Add entries to `utils/component-demo.config.js` to provide richer previews for complex shadcn/ui components. Each entry may define:
- `defaultProps` or `getDefaultProps`
- A custom `Demo` component for fine-grained control
- Optional metadata such as `wrapperClassName` or `note`

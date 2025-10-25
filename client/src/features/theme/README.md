# Theme Feature

This feature centralizes theme state, reusable UI primitives, and token metadata so the design system can be consumed across pages without duplicating logic.

## Structure

```
features/theme/
├── components/
│   ├── ThemeProvider.jsx
│   └── ThemeToggleCard.jsx
├── hooks/
│   └── useTheme.js
├── services/
├── utils/
│   └── tokens.js
├── index.js
└── README.md
```

- **components** expose UI building blocks such as the provider and toggle card.
- **hooks** contains `useTheme`, the primary way to read or mutate theme state inside React components.
- **services** is reserved for future integrations such as persistence APIs or remote token loaders.
- **utils** hosts serializable data (e.g., design tokens) and any supporting helpers shared by the feature.
- **index.js** re-exports the public API for ergonomic imports (`import { ThemeProvider } from '.../features/theme'`).

All routes should compose these exports rather than reaching into nested folders so the structure can evolve without widespread refactors.

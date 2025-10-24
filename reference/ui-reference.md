# UI Design Reference

This document defines the styling, theming, and UI structure for the project. We use a token-first design system, powered by Tailwind CSS, shadcn/ui, Lucide icons, and Tiptap for rich text editing. All components and styling must follow these conventions to ensure consistency, scalability, and easy theming.

## 1. Global Theme & Tokens

- Define all colors, typography, spacing, and radius in `:root` using CSS variables.
- Include a `.dark` variant to support dark mode.
- These variables will be consumed by Tailwind and shadcn components automatically.
- Examples of tokens to define:
  - `--background` and `--foreground` for light and dark mode
  - `--primary`, `--secondary`, `--muted`, `--destructive` for color system
  - `--font-sans` and `--font-mono` for typography
  - `--space-xs` through `--space-xl` for spacing scale
  - `--radius` for component border rounding

**Dev Rule:** Do not hardcode any color or spacing inside components. Always use Tailwind utility classes (e.g. `bg-primary`) which inherit from your tokens.

## 2. Typography

- Use standard HTML headings (`h1`, `h2`, `h3`) and paragraphs for most typography.
- Create utility classes (like `.h1`, `.h2`, `.text-muted`) to ensure consistency across pages.
- Define a clear scale: large for page titles, medium for section titles, and base for body text.
- Use `font-sans` and `font-mono` classes tied to tokens.
- Control color through text utility classes like `text-primary`, `text-muted`, etc.

**Dev Rule:** Typography should not be styled inline. Use pre-defined utilities or tokens.

## 3. Components (shadcn/ui)

- All common UI elements (buttons, modals, inputs, alerts, cards, popovers, tooltips, etc.) will be implemented using shadcn/ui components.
- Do not recreate these elements manually.
- Use component variant props for visual variations. For example, `default`, `secondary`, `outline`, and `destructive` button styles.
- Extend or override variants in their respective shadcn component files if customization is needed.

**Dev Rule:** No separate CSS should be written for components already available in shadcn/ui.

## 4. Lucide Icons

- Use Lucide icons for all iconography across the app.
- Keep icon sizes consistent (preferably `w-4 h-4` or `w-5 h-5`).
- Use Tailwind utility classes for colors so icons follow theme tokens automatically.
- Use icons inline with buttons and inputs for better UX.

**Dev Rule:** Do not embed SVGs directly. Use Lucide icon imports for consistency.

## 5. Layout & Utilities

- Use Tailwind utilities (`flex`, `grid`, `justify-center`, `items-center`) for layout.
- Define a minimal set of reusable layout helpers like `.flex-center` or `.container` if needed repeatedly.
- Manage spacing through the global spacing scale tokens.

**Dev Rule:** Prefer Tailwind layout utilities over writing new CSS.

## 6. Theme Modes (Light / Dark)

- Use the class strategy for theme switching.
- Define both light and dark colors in your tokens (`:root` and `.dark`).
- Use a ThemeProvider (e.g., `next-themes`) or manual toggling on the html element to switch themes.
- Never hardcode colors or manually style for dark mode. Tokens handle it.

**Dev Rule:** UI must remain fully functional and visually consistent in both light and dark modes.

## 7. Rich Text & Prose

- For content-heavy pages (e.g., blog, docs, markdown), define a `.prose` class for rich text formatting.
- Keep consistent spacing for headings and paragraphs in prose content.
- Typography inside `.prose` should inherit the global tokens for font, size, and color.
- Links in `.prose` should use the primary color and underline on hover.
- Lists and blockquotes should respect spacing tokens.
- Use the same scale and spacing rules applied elsewhere in the app.

**Dev Rule:** Use prose styles only for content sections, not for general UI.

### Tiptap Integration

We use the Tiptap Simple Editor Template for rich text input.

- Install with `npx @tiptap/cli@latest add simple-editor` (existing) or `npx @tiptap/cli@latest init simple-editor` (new projects).
- Integrate with Tailwind and shadcn styling.
- Replace default icons with Lucide icons for toolbar actions.
- Toolbar buttons should use shadcn variants (`ghost` or `secondary`).
- Inherit theme tokens for background and text.
- Fully supports dark mode out of the box.
- Store content as sanitized HTML or JSON.
- Use `.prose` for rendering read-only content.

## 8. File Structure

Recommended structure for maintainability:

- **theme.css**: defines tokens, global styles, light/dark colors.
- **globals.css**: includes Tailwind base, resets, and imports theme.css.
- **components/ui**: contains shadcn/ui components.
- **components/editor**: contains Tiptap SimpleEditor.
- **lib/utils.ts**: helper functions for class merging, if needed.

**Dev Rule:** All UI code should rely on tokens and Tailwind. No inline or ad-hoc CSS.


## 9. UI Folder Structure (Frontend)

client/
└── src/
    ├── components/
    │   ├── ui/                       # shadcn/ui primitives
    │   │   ├── button.jsx
    │   │   ├── input.jsx
    │   │   ├── card.jsx
    │   │   └── ...
    │   │
    │   ├── layout/                   # Layout helpers
    │   │   ├── Container.jsx
    │   │   └── FlexCenter.jsx
    │   │
    │   ├── editor/                   # Tiptap integration
    │   │   ├── SimpleEditor.jsx
    │   │   └── toolbar/
    │   │       ├── BoldButton.jsx
    │   │       └── ItalicButton.jsx
    │   │
    │   └── icons/                    # Lucide icon wrappers
    │       ├── IconWrapper.jsx
    │       └── ...
    │
    ├── styles/
    │   ├── theme.css                 # Tokens: colors, spacing, typography
    │   ├── global.css                # Tailwind base, imports theme.css
    │   └── prose.css                 # Rich text / markdown styling
    │
    ├── hooks/
    │   ├── useTheme.js               # Theme switching (light/dark)
    │   └── useMediaQuery.js          # Responsive helpers
    │
    └── lib/
        ├── api-client.js             # Shared API logic (used by UI)
        └── utils.js                  # Utility functions (e.g. class merging)



## 10. Usage Guidelines

- Use `bg-primary`, `text-primary`, `border-border` classes to inherit from tokens.
- Use variant props in shadcn components for consistent button and input styles.
- Use Lucide icons with Tailwind utilities for color.
- Keep spacing and sizing consistent across the app by using spacing scale tokens.
- Extend components only in their designated files to maintain consistency.

## 11. Developer DOs and DON'Ts

### ✅ DO

- Use tokens and Tailwind utilities.
- Use shadcn/ui for components.
- Use Lucide icons consistently.
- Keep layout and spacing consistent.
- Leverage dark mode with token overrides.

### ❌ DON'T

- Hardcode colors, spacing, or fonts.
- Build custom components for things already available in shadcn/ui.
- Mix inline styles with theme utilities.
- Define multiple variations of the same component without token references.

---

## ✅ Final Notes

- All visual design must come from tokens.
- All components must use shadcn/ui or be styled using Tailwind utilities.
- All icons must use Lucide.
- Rich text is handled through Tiptap with `.prose` for rendering.
- Theming works automatically in light and dark mode.

**This is the baseline for all frontend UI development in this project. All new features and components must follow this system.**
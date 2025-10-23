# UI Design Reference

This document consolidates UI component references for both **Tiptap** and **shadcn/ui**. Use this as a single source of truth for editor setup and UI component integration.

---

## 📄 Tiptap Editor Reference

# TipTap template

We will use below simple editor with full toolbar support.The Simple Editor Template is a fully working setup for the Tiptap editor. It includes commonly used open source extensions and UI components, all MIT licensed and ready to customize.

(https://template.tiptap.dev/preview/templates/simple)

## [](#installation)Installation

### [](#for-existing-projects)For existing projects

```
npx @tiptap/cli@latest add simple-editor
```

### [](#for-new-projects)For new projects

```
npx @tiptap/cli@latest init simple-editor
```

## [](#styling)Styling

This template requires styling setup. We stay unopinionated about styling frameworks, so you'll need to integrate it with your setup. Follow the [style setup guide](/docs/ui-components/getting-started/style) to ensure the editor displays correctly.

## [](#usage)Usage

After installation, use the SimpleEditor component in your React or Next.js project:

```
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor'

export default function App() {
  return <SimpleEditor />
}
```

## [](#features)Features

A fully responsive rich text editor with built-in support for common formatting and layout tools. All components are open source and easy to extend.

-   **Responsive design**: Mobile-friendly by default
-   **Dark and light mode**: Supported out-of-the-box
-   **Formatting**: Bold, Italic, Underline
-   **Lists**: Bullet, Ordered, Checkboxes
-   **Text alignment**: Left, Center, Right, Justified
-   **Headings**: Multiple levels via dropdown
-   **Image upload**
-   **Link editing:** UI for adding and editing links
-   **Undo / Redo:** History management

### [](#used-reference-components)Used reference components

#### [](#hooks)Hooks

-   `use-mobile`
-   `use-window-size`

#### [](#icons)Icons

-   `arrow-left-icon`
-   `highlighter-icon`
-   `link-icon`
-   `moon-star-icon`
-   `sun-icon`

#### [](#extensions)Extensions

-   `selection-extension`
-   `link-extension`
-   `trailing-node-extension`

#### [](#lib)Lib

-   `tiptap-utils`

#### [](#ui-components)UI Components

-   `blockquote-button`
-   `code-block-button`
-   `color-highlight-button`
-   `color-highlight-popover`
-   `heading-button`
-   `heading-dropdown-menu`
-   `image-upload-button`
-   `link-popover`
-   `list-button`
-   `list-dropdown-menu`
-   `mark-button`
-   `text-align-button`
-   `undo-redo-button`

#### [](#node-components)Node Components

-   `code-block-node`
-   `image-node`
-   `image-upload-node`
-   `list-node`
-   `paragraph-node`

#### [](#primitives)Primitives

-   `button`
-   `spacer`
-   `toolbar`

## [](#license)License

The Simple Editor Template and all included components are MIT licensed. You’re free to use, modify, and extend the code as needed.

## [](#future-compatibility)Future compatibility

You can extend this template with additional features as your needs grow.

Paid Tiptap Cloud features will have matching UI components that integrate just as easily! No rework needed.

---

## 🧱 shadcn/ui Reference

# shadcn/ui reference code

This document shows refernce for components and blocks including sidebar, login for shadcn/ui.

## Components

For components, you must refer to the URLs mentioned in for each compnent in the table below:

| Component | URL |
|-----------|-----|
| Accordion | https://ui.shadcn.com/docs/components/accordion |
| Alert | https://ui.shadcn.com/docs/components/alert |
| Alert Dialog | https://ui.shadcn.com/docs/components/alert-dialog |
| Aspect Ratio | https://ui.shadcn.com/docs/components/aspect-ratio |
| Avatar | https://ui.shadcn.com/docs/components/avatar |
| Badge | https://ui.shadcn.com/docs/components/badge |
| Breadcrumb | https://ui.shadcn.com/docs/components/breadcrumb |
| Button | https://ui.shadcn.com/docs/components/button |
| Button Group | https://ui.shadcn.com/docs/components/button-group |
| Calendar | https://ui.shadcn.com/docs/components/calendar |
| Card | https://ui.shadcn.com/docs/components/card |
| Carousel | https://ui.shadcn.com/docs/components/carousel |
| Chart | https://ui.shadcn.com/docs/components/chart |
| Checkbox | https://ui.shadcn.com/docs/components/checkbox |
| Collapsible | https://ui.shadcn.com/docs/components/collapsible |
| Combobox | https://ui.shadcn.com/docs/components/combobox |
| Command | https://ui.shadcn.com/docs/components/command |
| Context Menu | https://ui.shadcn.com/docs/components/context-menu |
| Data Table | https://ui.shadcn.com/docs/components/data-table |
| Date Picker | https://ui.shadcn.com/docs/components/date-picker |
| Dialog | https://ui.shadcn.com/docs/components/dialog |
| Drawer | https://ui.shadcn.com/docs/components/drawer |
| Dropdown Menu | https://ui.shadcn.com/docs/components/dropdown-menu |
| ... (full list continues)

## Building Blocks

Refer to https://ui.shadcn.com/blocks page for the Page Layout

---

## 🎨 Tailwind Theme Integration

We will use a **centralized Tailwind CSS theme** for the entire website to maintain visual consistency.  
This theme will be integrated with **shadcn/ui**, supporting:

- 🌞 **Light Mode** and 🌚 **Dark Mode**  
- 🎨 **Primary Color Palette**: Shades of **green**  
- 🧭 Centralized design tokens for spacing, typography, and component styling.

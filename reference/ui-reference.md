# UI Design Reference

This document defines UI standards for the frontend: Tiptap editor integration, shadcn/ui components, Tailwind theming, and icons — aligned with Project X guidelines.

- Language: 100% JavaScript (no TypeScript)
- Tooling: React (Vite), React Router, TailwindCSS + shadcn/ui
- Icons: Lucide React Icons only (no other icon sets)

---

## 📄 Tiptap Editor (React + Vite + JavaScript)

Use Tiptap directly in a Vite + React JavaScript app. Do not use TS/Next.js templates or scaffolds.

### Installation (JavaScript)

Install editor dependencies explicitly:

```
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-underline @tiptap/extension-image
```

### Minimal usage example

```
// src/components/editor/Editor.jsx
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import Image from '@tiptap/extension-image'

export default function Editor() {
  const editor = useEditor({
    extensions: [StarterKit, Underline, Link.configure({ openOnClick: true }), Image],
    content: '<p>Start writing…</p>'
  })

  return (
    <div className="prose dark:prose-invert max-w-none">
      <EditorContent editor={editor} />
    </div>
  )
}
```

If using `@/` imports, configure aliases (see “Project Conventions” below).

### Features and required behaviors

- Responsive editing surface, light/dark modes via Tailwind classes
- Formatting: Bold, Italic, Underline; Headings; Lists; Text alignment
- Links: Add/edit with UI affordances
- Undo/Redo via history
- Image upload integrated with presigned Evidence flow (see below)

### Image upload integration with Evidence service

All editor uploads must follow the Evidence Management flow: presigned URLs, checksums, metadata, and audit logging.

Process outline:

1) Request an upload session from `/api/v1/evidence/upload` with filename, size, mime_type, and checksum (e.g., SHA-256).
2) Receive presigned PUT URL + evidence id.
3) PUT the binary directly to storage using the presigned URL.
4) Notify the backend to finalize the upload (evidence id, computed checksum) so metadata and audit events are persisted.
5) Insert the resulting public path or signed GET link (when needed) into the document via the Tiptap Image extension.

Sketch for a client helper (pseudocode, JS):

```
async function uploadImage(file) {
  const checksum = await sha256(file) // compute in browser
  const start = await fetch('/api/v1/evidence/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: file.name, size: file.size, mime_type: file.type, checksum })
  }).then(r => r.json())

  await fetch(start.uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })

  const finalize = await fetch(`/api/v1/evidence/upload/${start.id}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ checksum })
  }).then(r => r.json())

  return finalize.publicUrl // or key to resolve via signed GET
}
```

Wire this helper into a custom Image menu action or upload button that calls `editor.chain().focus().setImage({ src: url }).run()`.

---

## 🧱 shadcn/ui Components (JS + Vite)

Use shadcn/ui primitives as JavaScript components. Do not keep TypeScript types or Next.js-specific code. When copying examples, convert `.tsx` → `.jsx` and remove types.

Curated components we rely on:

- Button, Input, Label, Select, Textarea
- Dialog, Drawer/Sheet, Dropdown Menu, Tooltip, Tabs
- Toast/Toaster, Badge, Avatar, Card, Skeleton
- Table/Data Table (with TanStack Table), Breadcrumb
- Form patterns (React Hook Form) coded in JS

Layout building blocks used across the app:

- App Shell: Sidebar (collapsible) + Top Header + Content area
- Page Header: Title, breadcrumbs, and primary actions
- Content Panels: Cards/tables; use Drawer/Sheet for create/edit flows

Refer to official docs for usage details: https://ui.shadcn.com

---

## 🎨 Tailwind Theme

We use a centralized Tailwind theme wired to shadcn/ui tokens with dark mode via `class` strategy and a primary green palette.

- Tailwind dark mode: `darkMode: 'class'` in `tailwind.config.js`
- Primary color: green shades; map to shadcn tokens
- Keep tokens in a global CSS file and reference via CSS variables

Example token setup:

```
/* src/styles/theme.css */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 142 71% 45%;        /* green-500 */
  --primary-foreground: 0 0% 100%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
}
.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 142 72% 29%;        /* green-700 */
  --primary-foreground: 0 0% 100%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
}
```

Tailwind config excerpt:

```
// tailwind.config.js
export default {
  darkMode: 'class',
  content: ['index.html', 'src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: 'hsl(var(--primary))',
        muted: 'hsl(var(--muted))'
      }
    }
  },
  plugins: [require('tailwindcss-animate')]
}
```

---

## 🔤 Icons — Lucide React Only

Use Lucide React Icons exclusively. Do not introduce other icon sets.

Installation:

```
npm install lucide-react
```

Usage:

```
import { Sun, MoonStar, Link as LinkIcon, Highlighter, ArrowLeft } from 'lucide-react'

export function ThemeToggle() {
  return (
    <button className="inline-flex items-center gap-2">
      <Sun className="h-4 w-4" /> Light
    </button>
  )
}
```

---

## 📦 Project Conventions (Vite + JS)

- Imports: If using `@/` alias, configure both Vite and `jsconfig.json`.

`vite.config.js` alias:

```
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } }
})
```

`jsconfig.json` paths:

```
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  }
}
```

---

## ✅ Compliance with Platform Standards

- JavaScript-only across all frontend code (no TS files or types)
- React (Vite) and React Router for navigation (no Next.js)
- TailwindCSS + shadcn/ui for all styling and components
- Lucide React Icons exclusively for icons
- Editor uploads must use presigned Evidence flows with checksums and audit logging

This page supersedes template-specific references and removes TypeScript/Next.js guidance to stay aligned with our platform.

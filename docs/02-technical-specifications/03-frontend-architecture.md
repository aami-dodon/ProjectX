# 3. Frontend Architecture <!-- omit in toc -->

>### TL;DR  
> This section defines the frontend architecture of the AI Governance Platform.  
> It describes how the **React.js (JavaScript)** application is structured, how it interacts with backend APIs, and how the user interface is organized into modular, maintainable components.  
> The frontend follows a **feature-based architecture**, built entirely in **JavaScript with no TypeScript**, using **Vite**, **React Router DOM**, **TailwindCSS**, and **shadcn/ui**.  
> The objective is to ensure a consistent, secure, and performant client-side application that integrates seamlessly with the backend services.

---



- [3.1 Purpose and Overview](#31-purpose-and-overview)
- [3.2 Project and Folder Structure](#32-project-and-folder-structure)
  - [Root-level directories](#root-level-directories)
  - [Naming Conventions](#naming-conventions)
- [3.3 UI Architecture and Component Design](#33-ui-architecture-and-component-design)
  - [Component Hierarchy](#component-hierarchy)
  - [Design Philosophy](#design-philosophy)
- [3.4 State Management](#34-state-management)
  - [Current State Layers](#current-state-layers)
- [3.5 Theming and Design System](#35-theming-and-design-system)
  - [Design System Components](#design-system-components)
  - [Theme Management](#theme-management)
- [3.6 API Integration and Data Flow](#36-api-integration-and-data-flow)
  - [Data Flow](#data-flow)
  - [API Layer](#api-layer)
- [3.7 Security and Accessibility](#37-security-and-accessibility)
  - [Security Measures](#security-measures)
  - [Accessibility (A11y)](#accessibility-a11y)
- [3.8 Localization and Configuration](#38-localization-and-configuration)
  - [Localization Model](#localization-model)
  - [Configuration](#configuration)

---

## 3.1 Purpose and Overview

The frontend provides the primary interaction layer between users and the platform’s governance ecosystem.  
It is built using **React.js** with **Vite** for a fast development experience and optimized builds.  
The entire client application is developed in **JavaScript only** — no TypeScript — ensuring consistent syntax and a simpler build pipeline across the engineering team.  

The frontend consumes REST APIs exposed by the Express.js backend and provides dashboards, compliance workflows, scorecards, reports, and administrative features.  
Its design focuses on **usability, performance, modularity, and accessibility**.

---

## 3.2 Project and Folder Structure

The frontend codebase follows a **feature-based organization** aligned with backend modules for maintainability.

### Root-level directories
- **client/src/features/** – Feature-specific folders (e.g., auth, dashboard, evidence, framework, tasks).  
- **client/src/components/** – Reusable shared components (buttons, modals, inputs, charts).  
- **client/src/layouts/** – Application layouts (main layout, dashboard layout, auth layout).  
- **client/src/hooks/** – Custom React hooks for data fetching, state handling, and API integration.  
- **client/src/context/** – Global context providers (auth, theme, notifications).  
- **client/src/routes/** – Route definitions managed via React Router DOM.  
- **client/src/utils/** – Utility functions, constants, and configuration helpers.  
- **client/src/styles/** – Tailwind configuration, global styles, and theme definitions.  
- **client/src/assets/** – Icons, logos, and images.  
- **client/src/app.js** – Main React application initializer.  
- **client/src/main.jsx** – Vite entry point and rendering logic.  

### Naming Conventions
- All files use lowercase with hyphens (`dashboard-page.jsx`, `auth-context.js`).  
- Component names use PascalCase (`DashboardCard`, `UserMenu`).  
- Shared utilities and hooks use camelCase.  

---

## 3.3 UI Architecture and Component Design

The frontend follows a **modular, component-driven design** using the principles of **Atomic Design** and feature encapsulation.

### Component Hierarchy
1. **Atoms:** Smallest UI elements (buttons, inputs, labels).  
2. **Molecules:** Combined components that serve specific functions (search bars, dropdowns).  
3. **Organisms:** Complex interface components (navbars, side panels, forms).  
4. **Templates:** Page-level structures defining UI layout.  
5. **Pages:** Final compositions linked to routes.

### Design Philosophy
- Reusable and independent components for scalability.  
- Shared components reside under `client/src/components/` for reuse.  
- Each feature folder manages its own page components, local states, and styles.  
- Components built with **shadcn/ui** and **TailwindCSS** ensure consistent styling and accessibility.

---

## 3.4 State Management

State management is handled through a combination of **React Context API** and **custom hooks** for simplicity and performance.  
Redux or Zustand may be introduced later if large-scale global state synchronization becomes necessary.

### Current State Layers
- **Auth Context:** Manages JWT tokens, user sessions, and role data.  
- **Theme Context:** Controls light/dark mode and theme persistence.  
- **Notification Context:** Handles in-app notifications and alerts.  
- **Feature-Level Local State:** Managed using React `useState` and `useReducer` within feature components.  

This hybrid approach balances simplicity with scalability while maintaining JavaScript-only consistency.

---

## 3.5 Theming and Design System

The UI follows a unified design language based on **TailwindCSS** and **shadcn/ui**.

### Design System Components
- **Typography:** Tailwind-based scalable font system.  
- **Colors:** Semantic colors mapped to compliance domains (green = compliant, red = risk, amber = pending).  
- **Components:** Prebuilt shadcn components (cards, buttons, tables, alerts, modals).  
- **Icons:** **Lucide React Icons** for consistent and modern visual cues.  

### Theme Management
- Theme configuration stored in context for runtime switching.  
- Follows accessibility standards (WCAG AA).  
- Supports dark and light themes, customizable per user preference.  

---

## 3.6 API Integration and Data Flow

The frontend interacts with the backend via REST APIs using **Axios** as the HTTP client.  
All API calls are abstracted into dedicated service files for maintainability.

### Data Flow
1. User performs an action (e.g., submitting evidence, viewing compliance reports).  
2. Axios sends a request to the backend’s Express API.  
3. JWT token attached in headers for authorization.  
4. Response handled and normalized through a shared interceptor.  
5. Data passed to the relevant feature component or global context.  
6. UI updates reflect new data through re-rendering.

### API Layer
- API endpoints defined in `client/src/features/<feature>/api.js`.  
- Interceptors handle error responses and token expiration.  
- Common configuration stored in `client/src/utils/api-config.js`.  

---

## 3.7 Security and Accessibility

The frontend enforces multiple layers of security to protect user data and prevent misuse.

### Security Measures
- **JWT-based authentication** for all protected routes.  
- **CORS** policies configured on the backend for authorized origins only.  
- **CSRF protection** via secure token headers.  
- **Content Security Policy (CSP)** enforced in deployment environments.  
- **Input validation** on both client and server layers.  
- **Session timeout** and token refresh policies to prevent stale sessions.  

### Accessibility (A11y)
- All components follow accessibility guidelines.  
- Semantic HTML elements for screen reader compatibility.  
- Keyboard navigation support across interactive elements.  
- High-contrast themes and focus states for visibility.

---

## 3.8 Localization and Configuration

Localization ensures that the interface can adapt to different languages and regional contexts as the platform scales.

### Localization Model
- Text content managed via JSON language files (e.g., `en.json`, `fr.json`).  
- Locale switching supported via user preferences stored in the database.  
- Dates, currencies, and numeric formats localized using standard JS libraries.  

### Configuration
- Environment variables managed via `.env` for frontend.  
- Configuration includes API base URL, analytics keys, and theme defaults.  
- No secrets stored client-side; sensitive keys managed server-side.  

---


# User Management System <!-- omit in toc -->

## Location: /server/src/modules/auth

>### TL;DR
> The user management system anchors identity, authentication, and session governance for the AI Governance Platform.
> It lives in `server/src/modules/auth`, coordinating JWT issuance, Casbin enforcement, and user lifecycle workflows.
> This guide walks through the service structure, login and recovery flows, administrative tooling, and the client integrations that depend on it.

---

- [Backend Specification](#backend-specification)
  - [Location & Directory Layout](#backend-location--directory-layout)
  - [Authentication & Session Flows](#authentication--session-flows)
  - [Administrative Controls](#administrative-controls)
- [Frontend Specification](#frontend-specification)
  - [Location & Directory Layout](#frontend-location--directory-layout)
  - [Reusable Components & UI Flows](#reusable-components--ui-flows)
- [Schema Specification](#schema-specification)
- [Operational Playbooks & References](#operational-playbooks--references)

---

## Backend Specification

### Backend Location & Directory Layout
The User Management backend lives under `server/src/modules/auth`, following the platform's feature-module convention where HTTP entry points, business logic, and infrastructure concerns are co-located.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L52-L86】

```
server/src/modules/auth/
├── controllers/        # Express handlers for /auth endpoints
├── services/           # Registration, login, token rotation, and email orchestration
├── repositories/       # Prisma data access for users, sessions, and roles
├── middleware/         # JWT validation, rate limiting, MFA hooks
├── emails/             # Nodemailer templates and delivery helpers
└── routes.ts           # Mounts the /auth router into the application
```

### Authentication & Session Flows
The Auth Service coordinates user lifecycle operations, session control, and security integrations for the AI Governance Platform. It relies on JWT-based authentication, Casbin RBAC enforcement, and Nodemailer to deliver transactional emails.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L74-L86】【F:docs/02-technical-specifications/06-security-implementation.md†L54-L75】

#### Registration (`POST /auth/register`)
1. Validate input payload (email, password, organization context).
2. Hash the password with bcrypt (≥12 rounds) and persist the user record with default RBAC role assignments.
3. Trigger optional verification or welcome emails via Nodemailer integration.
4. Log the event for audit purposes and apply rate limiting to prevent abuse.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L74-L86】【F:docs/02-technical-specifications/06-security-implementation.md†L54-L75】

#### Login (`POST /auth/login`)
1. Authenticate credentials against stored bcrypt hashes.
2. Issue a signed JWT containing user ID, role, and expiration, and generate a refresh token with longer validity for session continuity.
3. Store refresh token metadata (device, IP, expiry) for revocation and anomaly monitoring.
4. Enforce rate limiting and log attempts for security analytics.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L74-L86】【F:docs/02-technical-specifications/06-security-implementation.md†L54-L75】

#### Logout (`POST /auth/logout`)
1. Invalidate the active refresh token by removing or flagging the record in the session store.
2. Record the logout event in audit logs, including device and timestamp.
3. Optionally revoke other active sessions through administrative controls when suspicious activity is detected.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L74-L86】【F:docs/01-about/04-security-and-data-protection.md†L230-L249】

#### Refresh Tokens (`POST /auth/refresh`)
1. Validate the refresh token against stored metadata and enforce rotation policies.
2. Issue a new access token and (optionally) a new refresh token with updated expiry limits.
3. Reject reused or expired tokens and log invalidation attempts to support threat detection.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L74-L86】【F:docs/02-technical-specifications/06-security-implementation.md†L54-L75】

#### Password Reset Emails (`POST /auth/forgot-password`, `POST /auth/reset-password`)
1. Generate a time-bound reset token stored alongside user metadata.
2. Send password reset instructions via Nodemailer using templated content and secure links.
3. Validate the token, enforce password strength policies, and update the hashed password upon completion.
4. Log successful and failed reset attempts for compliance tracking.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L74-L80】

### Administrative Controls
Platform administrators operate dedicated tooling that interacts with the auth module to assign and delegate roles, manage authentication providers, and remediate risk.【F:docs/01-about/04-security-and-data-protection.md†L200-L259】 Key back-office automations include:

- Revoking user access, expiring active sessions, and orchestrating user lifecycle events with immutable logging for audits.【F:docs/01-about/04-security-and-data-protection.md†L230-L249】
- Configuring SSO connections, enforcing MFA policies, and managing passwordless enrollment options.【F:docs/01-about/04-security-and-data-protection.md†L206-L249】
- Executing break-glass procedures that grant temporary elevated access with real-time alerts and mandatory post-event reviews.【F:docs/01-about/04-security-and-data-protection.md†L253-L259】

## Frontend Specification

### Frontend Location & Directory Layout
React-based authentication experiences live within `client/src/features/auth`, complemented by shared state and UI primitives that surface authentication state across the app shell.【F:docs/02-technical-specifications/03-frontend-architecture.md†L50-L139】

```
client/src/features/auth/
├── pages/
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── ForgotPasswordPage.tsx
│   └── ResetPasswordPage.tsx
├── components/
│   ├── MfaEnrollmentWizard.tsx
│   └── PasswordStrengthMeter.tsx
├── hooks/
│   └── useAuthForm.ts
└── index.ts

client/src/state/auth/
├── AuthContext.tsx
└── authSlice.ts
```

### Reusable Components & UI Flows
- **Shared Components:** `client/src/components/forms/ControlledInput.tsx`, `client/src/components/layout/AuthGuard.tsx`, and `client/src/components/feedback/SessionTimeoutModal.tsx` are reused across login, registration, and MFA flows to deliver consistent experiences.
- **Authentication Screens:** Login, registration, password reset, and MFA setup pages mirror backend `/auth` endpoints with form validation, CSRF headers, and contextual messaging for account states.【F:docs/02-technical-specifications/03-frontend-architecture.md†L50-L139】
- **Session Awareness:** Global `AuthContext` persists JWT tokens, handles refresh logic, and surfaces role metadata so protected routes can enforce access in layouts and navigation.【F:docs/02-technical-specifications/03-frontend-architecture.md†L96-L139】
- **Security UX:** UI flows integrate security feedback (password strength meter, device trust prompts, session timeout modals) to align user experience with backend governance controls.【F:docs/02-technical-specifications/03-frontend-architecture.md†L143-L160】

## Schema Specification
- **Users (`auth_users`):** Stores identity attributes (id, email, hashed password, MFA status, tenant associations) with auditing metadata for onboarding and lifecycle tracking.
- **Sessions (`auth_sessions`):** Persists refresh tokens, device fingerprints, IP addresses, and expiry timestamps for revocation workflows.
- **Password Resets (`auth_password_resets`):** Maintains reset token hashes, expiration, and consumption state.
- **Role Links:** Joins to RBAC tables (`auth_roles`, `auth_role_assignments`) to bootstrap privileges immediately after registration and during administrative updates.
- Relationships between these entities ensure rotation policies, password resets, and session governance are enforced consistently across tenants.【F:docs/02-technical-specifications/06-security-implementation.md†L54-L95】

## Operational Playbooks & References

### Session Handling and RBAC
- JWT validation middleware protects all authenticated routes and rehydrates user context on each request.
- Refresh tokens extend sessions without reauthentication but are constrained by timeout and rotation policies.
- Casbin-backed RBAC policies ensure users only access resources permitted to their role, with admin tooling to review and revoke sessions as needed.【F:docs/02-technical-specifications/06-security-implementation.md†L54-L95】【F:docs/01-about/04-security-and-data-protection.md†L206-L238】

### Supported Authentication Methods
- **Single Sign-On (SSO):** Supports SAML 2.0 and OpenID Connect providers for federated login workflows.【F:docs/01-about/04-security-and-data-protection.md†L206-L216】
- **Multi-Factor Authentication (MFA):** Required for administrative and privileged accounts, with hooks in the login pipeline to validate second factors before issuing tokens.【F:docs/01-about/04-security-and-data-protection.md†L206-L216】
- **Passwordless Options:** Optional FIDO2 or hardware security keys can be registered to bypass passwords while maintaining strong assurance levels.【F:docs/01-about/04-security-and-data-protection.md†L206-L216】
- **Session Governance:** Automatic timeouts, refresh limits, and device tracking are enforced to manage risk across sessions and devices.【F:docs/01-about/04-security-and-data-protection.md†L206-L216】

### Related Documentation
- Backend Architecture & APIs – Auth Service overview.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L74-L86】
- Security Implementation – Authentication, session handling, and RBAC policies.【F:docs/02-technical-specifications/06-security-implementation.md†L54-L95】
- Security and Data Protection – Enterprise authentication methods and administrative governance.【F:docs/01-about/04-security-and-data-protection.md†L206-L259】

---

[← Previous](readme.md) | [Next →](../02-rbac-system/readme.md)

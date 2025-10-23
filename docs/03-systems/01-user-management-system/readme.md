# User Management System <!-- omit in toc -->

## Location: /server/src/modules/auth

>### TL;DR
> The user management system anchors identity, authentication, and session governance for the AI Governance Platform.
> It lives in `server/src/modules/auth`, coordinating JWT issuance, Casbin enforcement, and user lifecycle workflows.
> This guide walks through the service structure, login and recovery flows, administrative tooling, and the client integrations that depend on it.

---

- [Backend Specification](#backend-specification)
  - [Location & Directory Layout](#backend-location--directory-layout)
  - [Service Responsibilities & Collaborators](#service-responsibilities--collaborators)
  - [Authentication & Session Flows](#authentication--session-flows)
  - [API Surface & Contracts](#api-surface--contracts)
  - [Background Jobs & Event Hooks](#background-jobs--event-hooks)
  - [Administrative Controls](#administrative-controls)
- [Frontend Specification](#frontend-specification)
  - [Location & Directory Layout](#frontend-location--directory-layout)
  - [Reusable Components & UI Flows](#reusable-components--ui-flows)
- [Schema Specification](#schema-specification)
- [Operational Playbooks & References](#operational-playbooks--references)
  - [Session Handling and RBAC](#session-handling-and-rbac)
  - [Configuration, Secrets, and Environments](#configuration-secrets-and-environments)
  - [Testing & Quality Gates](#testing--quality-gates)
  - [Supported Authentication Methods](#supported-authentication-methods)

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

### Service Responsibilities & Collaborators
Within this module the Auth Service owns identity storage, credential verification, token lifecycle, and orchestration of RBAC, email, and audit pipelines mandated by the platform architecture.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L74-L140】【F:docs/03-systems/02-rbac-system/readme.md†L25-L115】
- **Core duties:** manage JWT access/refresh tokens, enforce Casbin policies, orchestrate password and MFA flows, and emit audit signals for every privileged action.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L74-L86】【F:docs/02-technical-specifications/06-security-implementation.md†L54-L144】
- **Upstream/Downstream:** collaborates with the RBAC module for authorization checks, pushes login/reset notifications through the Notification System, opens remediation tasks when suspicious access is detected, and streams events into the Audit Logging subsystem for immutable retention.【F:docs/03-systems/02-rbac-system/readme.md†L25-L115】【F:docs/03-systems/04-notification-system/readme.md†L1-L153】【F:docs/03-systems/06-audit-logging-and-monitoring/readme.md†L1-L120】【F:docs/03-systems/13-task-management-system/readme.md†L1-L115】
- **Integration surfaces:** exposes partner-ready endpoints for SSO callbacks, inbound webhooks, and service accounts that follow the platform’s integration architecture contracts and webhook retry semantics.【F:docs/02-technical-specifications/07-integration-architecture.md†L60-L187】

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

#### Enterprise Authentication Methods
- **SSO callbacks (`/auth/sso/:provider/callback`):** Validate SAML or OIDC assertions, map identity claims to existing tenants, provision just-in-time accounts, and fall back to MFA enrolment when role policies demand it.【F:docs/01-about/04-security-and-data-protection.md†L206-L259】【F:docs/02-technical-specifications/06-security-implementation.md†L54-L96】
- **MFA challenge (`POST /auth/mfa/verify`):** Enforce secondary factors for privileged roles with TOTP or WebAuthn checks before final JWT issuance, persisting device metadata for governance reporting.【F:docs/01-about/04-security-and-data-protection.md†L206-L216】【F:docs/02-technical-specifications/06-security-implementation.md†L54-L96】
- **Service and partner tokens (`POST /auth/service-tokens`):** Issue scoped API credentials used by probes and integrations under the shared Partner API governance model, including rotation and revocation hooks.【F:docs/01-about/04-security-and-data-protection.md†L219-L226】【F:docs/02-technical-specifications/07-integration-architecture.md†L145-L187】

### API Surface & Contracts
The module exposes REST endpoints aligned with the platform’s OpenAPI standards; controllers reside in `controllers/` and leverage shared error handlers to return the canonical `{ status, message, data, error }` response shape.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L74-L118】

| Endpoint | Purpose | Expected Inputs | Responses & Side Effects |
|----------|---------|-----------------|--------------------------|
| `POST /auth/register` | Create a local account and bootstrap RBAC assignments. | Email, password, tenant metadata, optional SSO hints. | `201` with user profile payload, emits welcome email, seeds `auth_role_assignments`, enqueues audit event.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L74-L118】【F:docs/02-technical-specifications/06-security-implementation.md†L54-L96】 |
| `POST /auth/login` | Authenticate user credentials or SSO handoff. | Email + password or provider token, MFA hints. | `200` with access/refresh tokens, writes session row, logs attempt, triggers risk checks and notifications on anomalies.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L74-L86】【F:docs/01-about/04-security-and-data-protection.md†L206-L239】 |
| `POST /auth/logout` | Terminate active session. | Refresh token identifier. | `204`, revokes session records, cascades token invalidation, and records audit entry for traceability.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L74-L86】【F:docs/01-about/04-security-and-data-protection.md†L243-L259】 |
| `POST /auth/refresh` | Rotate access tokens. | Refresh token, device info. | `200` with new tokens, rotation metadata updated, invalid attempts flagged for monitoring.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L74-L86】【F:docs/02-technical-specifications/06-security-implementation.md†L54-L96】 |
| `POST /auth/forgot-password` / `POST /auth/reset-password` | Manage password recovery workflow. | Email for initiation; token + password for completion. | `202` for initiation, `200` for reset, schedule email send, enforce password policies, log completion.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L74-L118】 |
| `POST /auth/mfa/enroll` / `POST /auth/mfa/verify` | Manage MFA secrets and verifications. | TOTP seed or WebAuthn challenge data. | `200`, persists MFA factors, flags accounts requiring step-up auth, records governance review items.【F:docs/01-about/04-security-and-data-protection.md†L206-L239】【F:docs/02-technical-specifications/06-security-implementation.md†L54-L96】 |
| `POST /auth/service-tokens` / `DELETE /auth/service-tokens/:id` | Issue and revoke service credentials. | Token label, scope, expiry. | `201` with credential metadata or `204` on revoke, updates integration registry, emits webhook for dependent services.【F:docs/01-about/04-security-and-data-protection.md†L219-L226】【F:docs/02-technical-specifications/07-integration-architecture.md†L145-L187】 |

### Background Jobs & Event Hooks
- **Session cleanup worker:** Scheduled task revokes stale refresh tokens, enforces inactivity policies, and notifies users about forced sign-outs through the Notification System.【F:docs/03-systems/04-notification-system/readme.md†L1-L153】【F:docs/02-technical-specifications/06-security-implementation.md†L54-L96】
- **Audit dispatchers:** Every login, logout, role change, and credential update emits structured events consumed by the Audit Logging system and forwarded to SIEM sinks with immutable retention.【F:docs/03-systems/06-audit-logging-and-monitoring/readme.md†L1-L120】【F:docs/01-about/04-security-and-data-protection.md†L261-L313】
- **Access review triggers:** Signals to the RBAC and Task Management systems when privilege thresholds or dormant accounts require remediation, aligning with quarterly access review policies.【F:docs/03-systems/02-rbac-system/readme.md†L51-L115】【F:docs/01-about/04-security-and-data-protection.md†L230-L239】【F:docs/03-systems/13-task-management-system/readme.md†L1-L115】

### Administrative Controls
Platform administrators operate dedicated tooling that interacts with the auth module to assign and delegate roles, manage authentication providers, and remediate risk.【F:docs/01-about/04-security-and-data-protection.md†L200-L259】 Key back-office automations include:

- Revoking user access, expiring active sessions, and orchestrating user lifecycle events with immutable logging for audits.【F:docs/01-about/04-security-and-data-protection.md†L230-L249】
- Configuring SSO connections, enforcing MFA policies, and managing passwordless enrollment options.【F:docs/01-about/04-security-and-data-protection.md†L206-L249】
- Executing break-glass procedures that grant temporary elevated access with real-time alerts and mandatory post-event reviews.【F:docs/01-about/04-security-and-data-protection.md†L253-L259】

## Frontend Specification

### Frontend Location & Directory Layout
React-based authentication experiences live within `client/src/features/auth`, complemented by shared state and UI primitives that surface authentication state across the app shell.【F:docs/02-technical-specifications/03-frontend-architecture.md†L40-L140】

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
- **Admin Adjacent Screens:** Auth screens link to RBAC and admin consoles for privilege reviews, reusing guard components defined in the RBAC feature set to keep enforcement consistent in client routing.【F:docs/03-systems/02-rbac-system/readme.md†L60-L88】【F:docs/02-technical-specifications/03-frontend-architecture.md†L52-L140】
- **Localization & Accessibility:** Forms load copy from JSON locale bundles and adhere to WCAG keyboard/focus contracts mandated by the frontend architecture, ensuring login experiences remain localized and accessible.【F:docs/02-technical-specifications/03-frontend-architecture.md†L143-L176】

## Schema Specification
- **Users (`auth_users`):** Stores identity attributes (id, email, hashed password, MFA status, tenant associations) with auditing metadata for onboarding and lifecycle tracking.
- **Sessions (`auth_sessions`):** Persists refresh tokens, device fingerprints, IP addresses, and expiry timestamps for revocation workflows.
- **Password Resets (`auth_password_resets`):** Maintains reset token hashes, expiration, and consumption state.
- **Role Links:** Joins to RBAC tables (`auth_roles`, `auth_role_assignments`) to bootstrap privileges immediately after registration and during administrative updates.
- Relationships between these entities ensure rotation policies, password resets, and session governance are enforced consistently across tenants.【F:docs/02-technical-specifications/06-security-implementation.md†L54-L95】
- **Service Tokens (`auth_service_tokens`):** Captures partner credential metadata (scope, expiry, lastUsedAt) and hooks into integration registries for cross-system revocation audits.【F:docs/02-technical-specifications/07-integration-architecture.md†L145-L187】
- **Audit Links (`auth_event_ledger`):** Appends authentication and lifecycle events with correlations to audit archives for immutability guarantees, feeding the enterprise logging fabric.【F:docs/01-about/04-security-and-data-protection.md†L261-L313】【F:docs/03-systems/06-audit-logging-and-monitoring/readme.md†L1-L120】

## Operational Playbooks & References

### Session Handling and RBAC
- JWT validation middleware protects all authenticated routes and rehydrates user context on each request.
- Refresh tokens extend sessions without reauthentication but are constrained by timeout and rotation policies.
- Casbin-backed RBAC policies ensure users only access resources permitted to their role, with admin tooling to review and revoke sessions as needed.【F:docs/02-technical-specifications/06-security-implementation.md†L54-L95】【F:docs/01-about/04-security-and-data-protection.md†L206-L238】

### Configuration, Secrets, and Environments
- Store per-environment credentials (JWT secrets, email providers, SSO certificates) in cloud-managed vaults and inject them via runtime environment variables following DevOps configuration standards.【F:docs/02-technical-specifications/05-devops-infrastructure.md†L56-L210】
- Containerized services expose the auth module as a dedicated pod or service with liveness/readiness probes; blue-green deployments rotate secrets and migrations in lockstep across environments.【F:docs/02-technical-specifications/05-devops-infrastructure.md†L108-L152】
- Infrastructure-as-Code definitions for auth dependencies (PostgreSQL schemas, Redis caches, secret stores) reside under `infra/` and must pass policy checks before apply.【F:docs/02-technical-specifications/05-devops-infrastructure.md†L82-L176】

### Testing & Quality Gates
- Backend controllers, services, and repositories are covered by Jest unit/integration suites, while frontend flows leverage Vitest and Cypress scenarios that exercise login, MFA, and recovery journeys.【F:docs/02-technical-specifications/09-testing-and-qa.md†L40-L171】
- API contracts are validated through Newman collections derived from OpenAPI definitions, and security/performance tests (OWASP ZAP, k6) are mandatory before production releases for this module.【F:docs/02-technical-specifications/09-testing-and-qa.md†L83-L156】
- CI pipelines fail on coverage regression below platform thresholds (≥85% unit, ≥70% integration) and surface results via GitHub Actions notifications to the auth engineering team.【F:docs/02-technical-specifications/09-testing-and-qa.md†L166-L200】

### Supported Authentication Methods
- **Single Sign-On (SSO):** Supports SAML 2.0 and OpenID Connect providers for federated login workflows.【F:docs/01-about/04-security-and-data-protection.md†L206-L216】
- **Multi-Factor Authentication (MFA):** Required for administrative and privileged accounts, with hooks in the login pipeline to validate second factors before issuing tokens.【F:docs/01-about/04-security-and-data-protection.md†L206-L216】
- **Passwordless Options:** Optional FIDO2 or hardware security keys can be registered to bypass passwords while maintaining strong assurance levels.【F:docs/01-about/04-security-and-data-protection.md†L206-L216】
- **Session Governance:** Automatic timeouts, refresh limits, and device tracking are enforced to manage risk across sessions and devices.【F:docs/01-about/04-security-and-data-protection.md†L206-L216】

### Related Documentation
- Backend Architecture & APIs – Auth Service overview.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L74-L86】
- Security Implementation – Authentication, session handling, and RBAC policies.【F:docs/02-technical-specifications/06-security-implementation.md†L54-L145】
- Security and Data Protection – Enterprise authentication methods and administrative governance.【F:docs/01-about/04-security-and-data-protection.md†L206-L259】
- Integration Architecture – Partner API, webhook semantics, and service credential governance.【F:docs/02-technical-specifications/07-integration-architecture.md†L145-L187】
- DevOps & Infrastructure – Deployment, secrets management, and runtime configuration for auth workloads.【F:docs/02-technical-specifications/05-devops-infrastructure.md†L56-L210】
- RBAC, Audit Logging, and Notification systems – Downstream modules consuming auth events and enforcing access governance.【F:docs/03-systems/02-rbac-system/readme.md†L25-L123】【F:docs/03-systems/04-notification-system/readme.md†L1-L153】【F:docs/03-systems/06-audit-logging-and-monitoring/readme.md†L1-L158】

---

[← Previous](readme.md) | [Next →](../02-rbac-system/readme.md)

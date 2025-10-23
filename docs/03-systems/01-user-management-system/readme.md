# User Management System <!-- omit in toc -->

## Location: /server/src/modules/auth

>### TL;DR
> The user management system anchors identity, authentication, and session governance for the AI Governance Platform.
> It lives in `server/src/modules/auth`, coordinating JWT issuance, Casbin enforcement, and user lifecycle workflows.
> This guide walks through the service structure, login and recovery flows, administrative tooling, and the client integrations that depend on it.

---

- [Location: /server/src/modules/auth](#location-serversrcmodulesauth)
- [1. System Overview](#1-system-overview)
- [2. Module Structure](#2-module-structure)
  - [2.1 Registration](#21-registration)
  - [2.2 Login](#22-login)
  - [2.3 Logout](#23-logout)
  - [2.4 Refresh Tokens](#24-refresh-tokens)
  - [2.5 Password Reset Emails](#25-password-reset-emails)
- [3. Session Handling and RBAC](#3-session-handling-and-rbac)
- [4. Supported Authentication Methods](#4-supported-authentication-methods)
- [5. Administrative Controls](#5-administrative-controls)
- [6. Frontend Flows](#6-frontend-flows)
- [7. Related Documentation](#7-related-documentation)

---

## 1. System Overview
The user management system is implemented in the backend `Auth Service` located at `server/src/modules/auth`. It coordinates user lifecycle operations, session control, and security integrations for the AI Governance Platform. The service relies on JWT-based authentication, Casbin RBAC enforcement, and Nodemailer to deliver transactional emails.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L74-L86】【F:docs/02-technical-specifications/06-security-implementation.md†L54-L75】

## 2. Module Structure
The `auth` module follows the platform's feature-based convention: controllers expose Express handlers, services encapsulate business logic, and repositories manage database access. It collaborates with shared middleware for token validation, utilities for hashing, integrations for email delivery, and the routes layer that mounts `/auth` endpoints.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L52-L86】

### 2.1 Registration
- **Endpoint:** `POST /auth/register`
- **Flow:**
  1. Validate input payload (email, password, organization context).
  2. Hash the password with bcrypt (≥12 rounds) and persist the user record with default RBAC role assignments.
  3. Trigger optional verification or welcome emails via Nodemailer integration.
  4. Log the event for audit purposes and apply rate limiting to prevent abuse.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L74-L86】【F:docs/02-technical-specifications/06-security-implementation.md†L54-L75】

### 2.2 Login
- **Endpoint:** `POST /auth/login`
- **Flow:**
  1. Authenticate credentials against stored bcrypt hashes.
  2. Issue a signed JWT containing user ID, role, and expiration, and generate a refresh token with longer validity for session continuity.
  3. Store refresh token metadata (device, IP, expiry) for revocation and anomaly monitoring.
  4. Enforce rate limiting and log attempts for security analytics.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L74-L86】【F:docs/02-technical-specifications/06-security-implementation.md†L54-L75】

### 2.3 Logout
- **Endpoint:** `POST /auth/logout`
- **Flow:**
  1. Invalidate the active refresh token by removing or flagging the record in the session store.
  2. Record the logout event in audit logs, including device and timestamp.
  3. Optionally revoke other active sessions through administrative controls when suspicious activity is detected.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L74-L86】【F:docs/01-about/04-security-and-data-protection.md†L230-L249】

### 2.4 Refresh Tokens
- **Endpoint:** `POST /auth/refresh`
- **Flow:**
  1. Validate the refresh token against stored metadata and enforce rotation policies.
  2. Issue a new access token and (optionally) a new refresh token with updated expiry limits.
  3. Reject reused or expired tokens and log invalidation attempts to support threat detection.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L74-L86】【F:docs/02-technical-specifications/06-security-implementation.md†L54-L75】

### 2.5 Password Reset Emails
- **Endpoints:** `POST /auth/forgot-password`, `POST /auth/reset-password`
- **Flow:**
  1. Generate a time-bound reset token stored alongside user metadata.
  2. Send password reset instructions via Nodemailer using templated content and secure links.
  3. Validate the token, enforce password strength policies, and update the hashed password upon completion.
  4. Log successful and failed reset attempts for compliance tracking.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L74-L80】

## 3. Session Handling and RBAC
- JWT validation middleware protects all authenticated routes and rehydrates user context on each request.
- Refresh tokens extend sessions without reauthentication but are constrained by timeout and rotation policies.
- Casbin-backed RBAC policies ensure users only access resources permitted to their role, with admin tooling to review and revoke sessions as needed.【F:docs/02-technical-specifications/06-security-implementation.md†L54-L95】【F:docs/01-about/04-security-and-data-protection.md†L206-L238】

## 4. Supported Authentication Methods
Security policies mandate multiple enterprise authentication choices that integrate with the auth module:
- **Single Sign-On (SSO):** Supports SAML 2.0 and OpenID Connect providers for federated login workflows.【F:docs/01-about/04-security-and-data-protection.md†L206-L216】
- **Multi-Factor Authentication (MFA):** Required for administrative and privileged accounts, with hooks in the login pipeline to validate second factors before issuing tokens.【F:docs/01-about/04-security-and-data-protection.md†L206-L216】
- **Passwordless Options:** Optional FIDO2 or hardware security keys can be registered to bypass passwords while maintaining strong assurance levels.【F:docs/01-about/04-security-and-data-protection.md†L206-L216】
- **Session Governance:** Automatic timeouts, refresh limits, and device tracking are enforced to manage risk across sessions and devices.【F:docs/01-about/04-security-and-data-protection.md†L206-L216】

## 5. Administrative Controls
Platform administrators operate dedicated tooling that interacts with the auth module to:
- Assign and delegate roles across organizational units while maintaining least-privilege access.【F:docs/01-about/04-security-and-data-protection.md†L200-L238】
- Configure SSO connections, enforce MFA policies, and manage passwordless enrollment options.【F:docs/01-about/04-security-and-data-protection.md†L206-L249】
- Revoke user access, expire active sessions, and orchestrate user lifecycle events with immutable logging for audits.【F:docs/01-about/04-security-and-data-protection.md†L230-L249】
- Execute break-glass procedures that grant temporary elevated access with real-time alerts and mandatory post-event reviews.【F:docs/01-about/04-security-and-data-protection.md†L253-L259】

## 6. Frontend Flows
The React client mirrors backend capabilities through dedicated auth views and context managers:
- `client/src/features/auth/` hosts login, registration, password reset, and MFA setup pages aligned with the `/auth` API contract.【F:docs/02-technical-specifications/03-frontend-architecture.md†L50-L103】
- Global `Auth Context` maintains JWT tokens, refresh logic, and role metadata, ensuring protected routes enforce session state across layouts.【F:docs/02-technical-specifications/03-frontend-architecture.md†L96-L139】
- Security measures in the frontend (CSP, CSRF headers, session timeout handling) complement backend controls for a cohesive user experience during authentication.【F:docs/02-technical-specifications/03-frontend-architecture.md†L143-L160】

## 7. Related Documentation
- Backend Architecture & APIs – Auth Service overview.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L74-L86】
- Security Implementation – Authentication, session handling, and RBAC policies.【F:docs/02-technical-specifications/06-security-implementation.md†L54-L95】
- Security and Data Protection – Enterprise authentication methods and administrative governance.【F:docs/01-about/04-security-and-data-protection.md†L206-L259】

---

[← Previous](readme.md) | [Next →](02-rbac-system.md)

# 6. Security Implementation <!-- omit in toc -->

>### TL;DR  
> This section defines the security implementation across all layers of the AI Governance Platform.  
> It explains how authentication, authorization, encryption, and auditing are enforced throughout the system.  
> Built on **Express.js (JavaScript)** and **React.js**, the platform follows a **security-by-design** approach using **JWT**, **Casbin**, **AES-256**, and **TLS 1.3**.  
> The goal is to maintain data confidentiality, integrity, and availability while ensuring compliance with global security standards such as ISO 27001, SOC 2, and NIST CSF.

---

- [6.1 Purpose and Overview](#61-purpose-and-overview)
- [6.2 Authentication and Authorization](#62-authentication-and-authorization)
  - [Authentication](#authentication)
  - [Authorization](#authorization)
  - [Security Practices](#security-practices)
- [6.3 Role-Based Access Control (RBAC)](#63-role-based-access-control-rbac)
  - [Role Definitions](#role-definitions)
  - [Implementation](#implementation)
- [6.4 Encryption and Secure Communication](#64-encryption-and-secure-communication)
  - [Data at Rest](#data-at-rest)
  - [Data in Transit](#data-in-transit)
  - [Key Management](#key-management)
- [6.5 Audit Logging and Immutability](#65-audit-logging-and-immutability)
  - [Scope of Audit Logs](#scope-of-audit-logs)
  - [Storage and Integrity](#storage-and-integrity)
  - [Retention and Access](#retention-and-access)
- [6.6 Security Headers and API Hardening](#66-security-headers-and-api-hardening)
  - [Implemented Headers](#implemented-headers)
  - [API Hardening](#api-hardening)
- [6.7 Rate Limiting and DDoS Protection](#67-rate-limiting-and-ddos-protection)
  - [Rate Limiting](#rate-limiting)
  - [DDoS and Abuse Prevention](#ddos-and-abuse-prevention)
- [6.8 Vulnerability Management and Penetration Testing](#68-vulnerability-management-and-penetration-testing)
  - [Vulnerability Management](#vulnerability-management)
  - [Penetration Testing](#penetration-testing)
  - [Continuous Improvement](#continuous-improvement)

---

## 6.1 Purpose and Overview

The platform is designed with **security by default** as a foundational principle.  
Every module — from data collection to reporting — adheres to standardized security controls that protect sensitive information and ensure compliance with industry frameworks.  

Security is integrated across:
- **Application Layer** – Authentication, session management, and RBAC.  
- **Data Layer** – Encryption, integrity validation, and retention controls.  
- **Infrastructure Layer** – Network isolation, TLS encryption, and monitoring.  

Security implementation is continuous, automated, and auditable, ensuring that every interaction within the platform remains traceable and compliant.

---

## 6.2 Authentication and Authorization

Authentication and authorization are implemented using **JWT (JSON Web Tokens)** and **Casbin**, ensuring stateless and policy-based access control.

### Authentication
- Users authenticate through a secure login endpoint managed by the **Auth Service**.  
- Successful authentication issues a **signed JWT** containing user ID, role, and expiration.  
- Tokens are validated on every protected route via middleware.  
- Refresh tokens used to extend sessions securely without re-login.  
- Expired tokens are invalidated and logged for auditing.  

### Authorization
- **Casbin** enforces access policies dynamically at runtime.  
- Policies define which users or roles can perform actions on specific resources.  
- Middleware evaluates user permissions before processing any API request.  
- Supports fine-grained, context-aware rules (e.g., per framework, per control, per resource type).

### Security Practices
- Passwords hashed with **bcrypt (minimum 12 salt rounds)**.  
- Login attempts rate-limited and logged.  
- MFA (Multi-Factor Authentication) optional for admin roles.

---

## 6.3 Role-Based Access Control (RBAC)

RBAC is the foundation for access management in both frontend and backend systems.  
It ensures that users only have permissions necessary to perform their assigned duties.

### Role Definitions
- **Admin:** Full system privileges, including configuration and policy management.  
- **Compliance Officer:** Manage frameworks, review controls, and approve evidence.  
- **Engineer:** Configure probes, submit evidence, and handle remediation.  
- **Auditor:** View compliance dashboards, scorecards, and audit trails (read-only).  
- **System Service:** Internal automation tasks (non-user, machine account).  

### Implementation
- Casbin policies stored in the **PostgreSQL** database.  
- RBAC checks performed at middleware level in Express.js.  
- Policies cached for performance and invalidated on change events.  
- Policy enforcement tested automatically as part of CI pipeline.

---

## 6.4 Encryption and Secure Communication

The platform applies **end-to-end encryption** across all data in transit and at rest.  
All encryption standards follow current best practices as defined by NIST and ISO.

### Data at Rest
- Encrypted using **AES-256** through managed database and storage configurations.  
- Prisma ensures ORM-level data validation before persistence.  
- MinIO storage encrypted with server-side encryption and KMS-managed keys.  
- Secrets stored securely in **Vault / AWS Secrets Manager / Azure Key Vault**.

### Data in Transit
- All communication between frontend, backend, and external services occurs over **HTTPS (TLS 1.3)**.  
- API endpoints enforce SSL-only connections.  
- HSTS (HTTP Strict Transport Security) enabled to prevent downgrade attacks.  
- JWT tokens signed using **HMAC SHA-512** with rotating secret keys.

### Key Management
- Key rotation scheduled every 90 days.  
- Keys stored outside of application runtime in secure vaults.  
- Access to keys restricted to DevOps leads and CI/CD systems only.

---

## 6.5 Audit Logging and Immutability

The audit logging subsystem ensures that all critical actions are captured, time-stamped, and immutable.

### Scope of Audit Logs
- User authentication and access attempts.  
- CRUD operations on frameworks, controls, and evidence.  
- Administrative actions (role changes, configurations, policy updates).  
- System events (service restarts, deployments, incident alerts).  

### Storage and Integrity
- Logs written using **Winston** and stored as structured JSON.  
- Forwarded to centralized log management (ELK, Loki, or CloudWatch).  
- Immutable logs protected by **append-only** policies.  
- Cryptographic hashing ensures integrity and non-repudiation.  

### Retention and Access
- Logs retained for a minimum of 36 months by default, exceeding the 400-day regulatory floor and configurable for longer jurisdictional requirements.
- Read access restricted to Admins and Auditors only.
- Archived logs stored in encrypted cold storage for regulatory audits, with immutable snapshots preserved for at least 7 years.

---

## 6.6 Security Headers and API Hardening

The Express.js server applies modern security headers and middleware to prevent common web vulnerabilities.

### Implemented Headers
- **Content-Security-Policy (CSP):** Prevents inline script execution and data injection.  
- **X-Frame-Options:** Blocks clickjacking attacks.  
- **X-Content-Type-Options:** Prevents MIME-type sniffing.  
- **Strict-Transport-Security (HSTS):** Enforces HTTPS-only access.  
- **Referrer-Policy:** Restricts sensitive data leakage via headers.  
- **Permissions-Policy:** Controls access to browser features (camera, mic, geolocation).  

### API Hardening
- All input validated and sanitized before processing.  
- Rate limiting enforced on login and critical APIs.  
- CORS policies restrict origins to trusted domains.  
- Hidden endpoints protected behind admin-only access controls.  
- Static assets served via secure CDN with cache invalidation.

---

## 6.7 Rate Limiting and DDoS Protection

### Rate Limiting
- Implemented using Express middleware.  
- Request thresholds based on endpoint criticality (e.g., `/auth/login` limited to 5/minute).  
- IP-based throttling with exponential backoff.  
- Violations logged and flagged for monitoring.

### DDoS and Abuse Prevention
- Web Application Firewall (WAF) configured at ingress layer.  
- Load balancer enforces connection throttling for large bursts.  
- Application-level caching minimizes redundant requests.  
- Automated blocking of abusive IPs through monitoring tools (Fail2Ban or Cloudflare).  
- Bot detection using user-agent analysis and behavioral heuristics.

---

## 6.8 Vulnerability Management and Penetration Testing

The platform follows a proactive approach to vulnerability management, aligned with ISO 27001 and SOC 2 Type II standards.

### Vulnerability Management
- Dependencies scanned continuously using **npm audit**, **Snyk**, or **Dependabot**.  
- Critical vulnerabilities patched within 48 hours.  
- Regular internal scans for configuration drift and secret exposure.  
- Security advisories reviewed weekly during sprint planning.  

### Penetration Testing
- Conducted bi-annually by independent security auditors.  
- Includes black-box and white-box testing of APIs and infrastructure.  
- Findings triaged using severity scoring (CVSS v3).  
- Results tracked in the platform’s risk register for follow-up and remediation.  

### Continuous Improvement
 - Security posture reviewed after every major release.  
 - Incident response drills conducted quarterly.  
 - Bug bounty program planned post-production to engage ethical researchers.

---

[← Previous](05-devops-infrastructure.md) | [Next →](07-integration-architecture.md)

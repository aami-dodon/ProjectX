Project X is positioned as the AI Compliance Cloud that automates governance, risk, and compliance for enterprise AI. It brings together evidence collection, automated scoring, and actionable response so organizations can prove trustworthiness, surface risks early, and stay aligned with the fastest-moving global standards.

## What the platform surfaces

- **Framework-aware governance**: Compliance scoring is aligned with the EU AI Act, NIST AI RMF, and ISO/IEC 42001—Project X helps teams see how every control maps to the frameworks regulators care about.
- **Probes and Checks**: Lightweight probes crawl operational data (configuration, documentation, logs) while checks validate that evidence against configurable rules, producing clear results like compliant, non-compliant, or partially compliant.
- **Control mapping engine**: Controls synthesize dozens of checks into higher-level objectives (model transparency, data quality, risk mitigation), giving stakeholders a digestible view of where each control is satisfied or needs attention.
- **Actionable insights**: Dashboards highlight risk spikes, observations, and mitigation tasks while guided diagnostics walk teams through incident triage with confidence.
- **Operational rigor**: Built-in runbooks, status feeds, confidence escalations, and transparent guardrails keep AI, compliance, and IT contributors coordinated during audits or incidents.

## Strategic objective

The platform automates AI compliance instead of forcing teams to rely on spreadsheets or manual audits. It keeps evidence collection continuous, validates governance posture via rules-based checks, and surfaces governance scores with narrative explanations so leadership can trust every report. Project X transforms governing AI from a reactive exercise into a proactive, measurable capability.

## Problem statement

Modern organizations struggle with fragmented compliance practices, manual evidence gathering, and tracking multiple overlapping standards. AI governance is still nascent, so enterprises often lack a common process that scales across products or teams. Project X fills that gap by unifying controls, capturing risk observations, and letting teams track maturity transparently.

## Target users

- **AI and data science teams** who need to prove responsible development, embed documentation, and validate practices without slowing innovation.
- **Compliance and risk officers** that need continuous monitoring, automated scoring, and artefacts that can go straight into audit reports.
- **IT and security teams** providing technical evidence (logs, configurations, access controls) to the governance process.
- **Product owners and AI leaders** who want to understand governance readiness and manage remediation tasks tied to observations.
- **Regulated industries (BFSI, healthcare, government)** that must demonstrate traceability and policy alignment for every AI decision path.

## Strategic vision

Over the next 2–3 years, Project X aims to become the “AI Compliance Cloud”: a trusted system of record for ongoing AI governance. Future goals include cross-framework benchmarking, continuous monitoring with predictive analytics, and integration into broader GRC/ESG ecosystems. The platform is built to scale with organizations as their AI portfolios expand, giving them measurable, transparent governance with predictable risk management.

## Why it matters

AI governance is essential yet complex. Project X makes it operational by keeping AI teams and regulators working from a single source of truth, surfacing control coverage, and documenting how every probe and check contributes to compliance. This transparency builds trust and helps organizations move from reactive audits to confident, continuous governance.

## Getting started

1. Copy the configuration template and edit the runtime settings:
   ```bash
   cp .env.example .env
   ```
   Provide PostgreSQL, MinIO, SMTP, and port values so both the backend API and the frontend dashboard share a consistent environment.

2. Install dependencies and run each workspace:
   ```bash
   cd server && npm install
   npm run dev
   ```
   ```bash
   cd ../client && npm install
   npm run dev
   ```
   The client and server read from the same `.env`, so ensure values such as API URLs and credentials stay aligned.

3. Before committing, run linting, formatting, and tests in both workspaces to keep quality gates passing. This keeps both sides consistent as the project evolves.

## Demo Access

You can try the live demo of **Project X** here:

**Demo URL:** [https://projectx.dodon.in](https://projectx.dodon.in)  
**User ID:** `admin@example.com`  
**Password:** `projectX`

> ⚠️ **Disclaimer:** The demo environment is for evaluation purposes only.  
> All data is **erased periodically** and will **not be persistent** between sessions.


# Probe Management Module

This module exposes the backend APIs, services, and SDK helpers that power the Probe Management System described in `docs/03-systems/07-probe-management-system/readme.md`.

## Contents

```
server/src/modules/probes
├── api                 # Express controllers and router
├── events              # Event emitters for heartbeat/evidence/failure/deployment streams
├── repositories        # Prisma data access helpers
├── sdk                 # Probe SDK runtime utilities
├── services            # Registry, scheduler, deployment, and health orchestrators
├── workflows           # High-level workflows for registration and rollout
└── __tests__           # Jest specs covering SDK behaviors
```

## Routes

All routes are mounted beneath `/api/probes` and require authentication plus Casbin permission checks:

- `GET /api/probes` — list probes with pagination and filters
- `POST /api/probes` — register a new probe draft
- `GET /api/probes/:probeId` — fetch probe metadata + related schedules/deployments
- `GET /api/probes/:probeId/metrics` — retrieve heartbeat/latency telemetry
- `POST /api/probes/:probeId/run` — queue an ad-hoc execution window
- `GET|POST /api/probes/:probeId/deployments` — view or start rollouts
- `GET|POST /api/probes/:probeId/schedules` — manage cron/event schedules

See `api/probes.router.js` for OpenAPI annotations and middleware wiring.

## Services & Workflows

- `registry.service` handles CRUD operations for probe metadata, slug generation, and validation through Zod schemas.
- `deployment.service` delegates rollouts to `rolloutProbeWorkflow`, which merges environment overlays, runs self-tests, and records deployment events.
- `scheduler.service` composes `ProbeScheduler` helpers to derive next-run windows and dispatch ad-hoc executions.
- `health.service` centralizes metrics aggregation and heartbeat status transitions.

## SDK Helpers

The lightweight SDK under `sdk/` mirrors the Probe SDK contracts documented in the system spec:

- `ProbeClient` – wraps evidence + heartbeat submissions.
- `ProbeScheduler` – derives cron/adhoc next-run timestamps.
- `ProbeHealthClient` – normalizes heartbeat status + runs simple self-tests.
- `ProbeConfigLoader` – merges environment overlays with defaults.
- `ProbeVersionManager` – enforces minimum SDK versions and recommends upgrades.

## Events

Event helpers publish `probe.heartbeat.v1`, `probe.evidence.v1`, `probe.failure.v1`, and `probe.deployment.v1` messages via a shared in-process event bus. These events allow other modules (notifications, tasking, evidence ingestion) to subscribe without tight coupling.

---

Update this document when the module surface changes so it remains a reliable companion to the system design notes in `docs/03-systems/07-probe-management-system`.

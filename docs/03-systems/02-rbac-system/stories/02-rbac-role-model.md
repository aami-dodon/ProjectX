# Story: RBAC Role Model

## Summary
Explain the hierarchical role structure, permission granularity, and enforcement surface used to evaluate access decisions.

## As a…
As a security designer

## I want to…
I want to understand RBAC inheritance

## So that…
So that least privilege and separation of duties remain intact

## Acceptance Criteria
- [ ] Roles such as Admin, Compliance Officer, Engineer, Auditor, and System Service inherit capabilities according to policy.
- [ ] Enforcement combines Casbin domains, middleware checks, and audit logging for deny/allow decisions.

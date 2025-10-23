# Story: Password Reset Workflow

## Summary
Support time-bound password resets with secure email delivery and policy enforcement.

## As a…
As a user who forgot my password

## I want to…
I want a reliable reset process

## So that…
So that I can regain access without compromising security

## Acceptance Criteria
- [ ] Reset initiation generates expiring tokens, sends templated emails, and records requests for auditing.
- [ ] Reset completion validates the token, enforces password strength, and updates hashed credentials.

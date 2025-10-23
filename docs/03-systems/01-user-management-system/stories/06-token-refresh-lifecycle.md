# Story: Token Refresh Lifecycle

## Summary
Rotate access tokens through validated refresh tokens with reuse detection and logging.

## As a…
As a returning authenticated user

## I want to…
I want to refresh my session

## So that…
So that long-lived access stays secure without re-login

## Acceptance Criteria
- [ ] Refresh tokens are checked against stored metadata and rotation policies before issuing new tokens.
- [ ] Rejected or expired refresh attempts are logged and surfaced for threat detection.

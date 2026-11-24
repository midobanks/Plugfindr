# ADR 0002 — Authentication boundaries

- Status: Accepted
- Date: 2026-11-24

## Context

Plugfindr needs email, Google and phone OTP sign-in (`BIZ-1`, `SPC-1`). No Google OAuth client,
SMS provider, session strategy, MFA mechanism or retention periods have been approved. Live auth
must not ship with fake providers.

## Decision

Define provider ports in `packages/adapters` for OTP, Google ID-token verification, email/password
verification, session storage and rate limiting. In-memory fakes exist only for local work and
tests. Session shape and role checks live in `packages/domain`; admin and MFA roles are explicit.
The web app exposes a protected `/v1/me` route that returns 401 until a real session store is
configured. No login endpoint, provider SDK, secret or OTP value is enabled in production.

## Alternatives

- Add NextAuth or a hosted auth SDK now: requires choosing a provider and session policy before
  approval, and would couple domain rules to a framework.
- Accept any cookie value as a session: would bypass authentication and leak account access.

## Consequences

- Auth work stays framework-free and testable; 57 tests cover ports, fakes, roles and error mapping.
- Provider selection, session lifetimes, revocation, MFA delivery, rate-limit thresholds, consent
  copy and retention periods must be approved before enabling live sign-in.
- The admin console remains unavailable until role checks, MFA and audit logging are wired.

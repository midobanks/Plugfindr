# ADR 0012 — Admin access foundation

- Status: Accepted
- Date: 2026-11-24

## Context

The admin console must not become usable before role checks, MFA and audit logging are in place
(`ADM-7`). Admin roles differ in sensitivity, but no MFA provider or audit backend has been chosen.

## Decision

Define explicit admin permissions mapped to internal roles in the domain. Reviewer, trust and safety,
admin and finance roles require a recent MFA verification on the session (15-minute window). The
web admin session helper now enforces MFA freshness. Add a protected `/v1/admin/me` scaffold that
returns only the role and permissions, and define an `AuditStore` port plus fake for future
sensitive-action logging. Audit events contain identifiers, actor role, action and timestamps only.

## Alternatives

- Treat any internal role as equivalent: would over-grant sensitive capabilities such as user
  suspension or verification review.
- Rely on a client-supplied MFA flag: could be forged.
- Log admin actions with free-form metadata: risks leaking personal data or uploaded document details.

## Consequences

- Admin permissions and MFA freshness are testable without a provider.
- No admin data actions are enabled yet; each must call the permission check and write an audit event.
- MFA delivery, session lifetime, audit retention and admin backend selection remain open decisions.

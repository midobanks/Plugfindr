# ADR 0003 — Request intake boundaries

- Status: Accepted
- Date: 2026-11-24

## Context

The P1 request flow must capture a useful brief in about three minutes (`REQ-1`), save it with a
tracked status (`REQ-3`), confirm an SLA (`REQ-4`) and keep trust in the matching handoff. Live
sign-in is not enabled, so the API cannot yet create a real request for a real business.

## Decision

Request rules live in `packages/domain` as pure validation; the web boundary uses Zod before
calling them. A `RequestStore` port has an in-memory fake for tests and a Prisma implementation for
future wiring. Submission is rate-limited through a `RateLimiter` port. The runtime ports are
unconfigured, so `/v1/requests` returns 401 without a session and 503 until stores are approved
and wired. The UI uses three short steps, externalised copy, HTTPS-only links and a 24-hour
confirmation message.

## Alternatives

- Harden a public endpoint that accepts any cookie: would bypass authentication.
- Persist directly from the route handler into Prisma: would couple the boundary to the ORM and
  make negative-path tests depend on a database.

## Consequences

- Validation, rate limiting and persistence are independently testable; no live auth or provider
  is implied.
- Schema fields for budget range, skills and links were added with a forward-only migration.
- Provider/session wiring, request editing (`REQ-3`) and matching workbench (`MAT-1`) remain open.

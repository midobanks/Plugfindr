# ADR 0005 — Approved-only discovery

- Status: Accepted
- Date: 2026-11-24

## Context

Discovery must show only specialists whose profiles are approved and whose required verification is
current (`DIS-1`, `VER-4`, `VER-5`). Search may move from Postgres to a dedicated engine later, so
the web layer must not depend on provider-specific query code. The runtime has no search provider
or database connection configured yet.

## Decision

`packages/domain` derives a public specialist document from profile and verification records, using
the existing discoverability rule as the single gate. `packages/adapters` owns a `SearchService`
port with an in-memory fake. `packages/database` provides a Postgres-backed implementation that
queries only approved, non-deleted profiles with current identity verification and selects only
public fields. The web runtime leaves the port unconfigured, so `/specialists` always shows the
honest empty state instead of fabricated results. Badge links point to `/trust`, where each signal
is explained without claiming a check that has not happened.

## Alternatives

- Render hardcoded "featured specialists": would imply trust and supply that do not exist.
- Expose verification records directly: would risk leaking sensitive check details and dates.
- Couple the web layer to Prisma: would make a future search-engine migration invasive.

## Consequences

- Unapproved, suspended, unverified and expired-identity profiles cannot enter the public index.
- Contact details, ID documents and private verification notes never appear in search documents.
- Provider replacement only requires a new `SearchService` implementation and a runtime change.
- Profile detail pages and category/query filters work against the same public document shape.

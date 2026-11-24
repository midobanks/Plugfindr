# ADR 0004 — Specialist onboarding boundaries

- Status: Accepted
- Date: 2026-11-24

## Context

Supply quality depends on a complete specialist profile before review (`SPC-2`, `SPC-3`, `PRF-1`).
Discovery and matching must never expose a profile that has not completed review and the required
checks. Live authentication is still not enabled, so a submission can only be scaffolded honestly.

## Decision

Profile rules, completeness scoring and the pending-to-approved state machine live in
`packages/domain`. The web boundary uses Zod before calling the domain validator. A
`SpecialistProfileStore` port has an in-memory fake for tests; the runtime port is unconfigured,
so `/v1/specialists/profile` returns 401 without a session, 403 for non-specialist roles and 503
until a store is approved and wired. The form is a three-step guided builder with a live
completeness score. Submitted profiles are explicitly `pending` and `discoverable: false`.

## Alternatives

- Let any signed-in user create a public specialist profile: would bypass role and review rules.
- Hardcode fake approved specialists in the UI: would imply verification that has not happened.

## Consequences

- Completeness, validation and state transitions are independently testable.
- Contact details, ID data and employer-hiding preferences stay inside the private profile path.
- Verification document handling, media/portfolio uploads, search indexing and reviewer tooling
  remain separate future slices.

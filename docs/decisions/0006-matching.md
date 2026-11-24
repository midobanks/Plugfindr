# ADR 0006 — Explainable human-assisted matching

- Status: Accepted
- Date: 2026-11-24

## Context

P1 matching is human-assisted (`MAT-1`). Every suggestion must carry two to three plain-language
reasons (`MAT-3`), specialists must opt in before a match is final (`MAT-4`), and conflicts or
blocks must exclude a specialist (`MAT-8`). Ranking must not be purchasable (`DIS-9`).

## Decision

`packages/domain` owns deterministic scoring, shortlist filtering and match-state transitions. The
score is an explainable sum of category, skill, availability, budget, location, verification and
experience factors; no payment, sponsorship or exposure field exists in the scoring input. Results
are sorted by score and then specialist ID so fixed inputs always produce the same order. Matches
start as `proposed`; confirmation is rejected unless the specialist has recorded opt-in. The
`MatchStore` port has an in-memory fake, while the web runtime remains unconfigured so the shortlist
page shows an honest empty state instead of invented matches.

## Alternatives

- Let a hidden model choose and rank specialists: would break explainability and P1 human review.
- Present a proposed specialist as confirmed before opt-in: would create dead-end introductions.
- Include paid boosts in the score: would introduce pay-to-win ranking.

## Consequences

- Match rules, reason generation and state transitions are independently testable.
- The matcher tool can display both the score and its breakdown without exposing private profile
  or verification document data.
- Persisting shortlists, opt-in capture, introductions and reviewer tooling remain separate slices
  behind role checks and audit logging.

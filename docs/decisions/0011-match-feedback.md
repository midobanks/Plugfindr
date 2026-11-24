# ADR 0011 — Match feedback

- Status: Accepted
- Date: 2026-11-24

## Context

Businesses need to mark a match as relevant or not relevant and give a reason (`MAT-5`). This is
input for future tuning, but P1 matching remains human-assisted and ranking must not be purchasable
or silently altered.

## Decision

The domain records feedback only from the business that owns the request, requires a reason for
`not_relevant`, and stores feedback separately from match scoring. Feedback does not change match
score, order or exposure in this slice. A `MatchFeedbackStore` port keeps future tuning read-only
over an explicit dataset; the web route requires a session, validates the body and rate-limits
submissions.

## Alternatives

- Mutate match scores immediately: would change exposure without review and could obscure bias.
- Accept specialist IDs or business IDs from the request body: would allow forged feedback.
- Store feedback in analytics events: would mix user-generated text into event payloads.

## Consequences

- Feedback is available for later human review and tuning decisions.
- Match ranking remains deterministic and explainable for fixed inputs.
- Any future use of feedback to affect exposure requires a separate reviewed decision.

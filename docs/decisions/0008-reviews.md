# ADR 0008 — Review eligibility and privacy

- Status: Accepted
- Date: 2026-11-24

## Context

Reviews must come only from parties to a completed engagement (`VER-10`, `ENG-15`, `ENG-16`). They
use a 1 to 5 rating across quality, communication, reliability and value, with an optional private
feedback field for Plugfindr. No legal copy or payout logic is involved in P1 reviews.

## Decision

`packages/domain` owns review eligibility, one review per party per completed engagement, rating
validation and a public projection that drops private feedback. The review store never holds contact
details, and the API returns only a receipt. Both business and specialist sessions may submit a
review; the domain derives the party from the engagement record rather than trusting the request
body. Runtime stores remain unconfigured, so `/v1/reviews` returns 503 until persistence is wired.

## Alternatives

- Accept reviews from any signed-in user: would allow unverified or unrelated ratings.
- Return private feedback in public review payloads: would expose confidential platform feedback.
- Let the client choose the review party: would make impersonation trivial.

## Consequences

- Ratings cannot be fabricated for incomplete or unrelated engagements.
- Public review data is a narrow projection, not the stored record.
- Review moderation, specialist responses and profile display remain separate slices.

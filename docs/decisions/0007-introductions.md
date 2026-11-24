# ADR 0007 — Introductions and contact masking

- Status: Accepted
- Date: 2026-11-24

## Context

A business can request an introduction from a profile or match (`ENG-1`), the specialist responds
within a visible window (`ENG-2`), and acceptance opens a conversation thread (`ENG-3`). Contact
details must remain masked until the specialist shares them or an engagement is confirmed
(`ENG-5`). Policy for off-platform contact is still open.

## Decision

Introduction creation, 48-hour response windows, acceptance, decline and expiry live in
`packages/domain`. Acceptance returns a deterministic conversation-thread ID. An `IntroductionStore`
port holds only introduction state and summaries, never contact details. Contact views are derived
from a separate private contact record and a visibility rule that reveals details only after
specialist opt-in or a hired/in-progress/completed engagement. The web route requires a business
session, validates input at the boundary, rate-limits requests and returns 503 while stores are
unconfigured.

## Alternatives

- Store contact details on the introduction record: would scatter sensitive data and make masking
  easy to bypass.
- Reveal contact on acceptance: would violate `ENG-5` and push conversations off-platform too early.
- Allow any authenticated role to request introductions: would bypass the business/specialist model.

## Consequences

- Contact masking is an explicit domain rule with tests, not a UI convention.
- Message bodies, IDs and documents are never logged by the introduction path.
- Conversation threading, specialist response UI, read receipts and WhatsApp notifications remain
  separate slices behind provider approvals.

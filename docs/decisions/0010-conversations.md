# ADR 0010 — Conversation threads

- Status: Accepted
- Date: 2026-11-24

## Context

An accepted introduction must open a private conversation thread (`ENG-3`). Messages and contact
details are sensitive, and notifications/attachments require provider decisions that are still open.

## Decision

The domain derives conversation participants from the introduction record and opens a thread only on
an accepted introduction. Only the specialist may accept or decline an introduction. Message posting
is participant-checked, length-bound and stores no contact details. A `ConversationStore` port holds
threads and messages behind a fake for tests; web routes require a session, validate bodies and
return 503 until stores are configured. Message bodies are never logged.

## Alternatives

- Derive participants from the request body: would let outsiders join threads.
- Send message content through the notification provider as part of this slice: would choose a
  messaging provider and duplicate private content.
- Expose a public message feed: would violate least exposure.

## Consequences

- Acceptance produces a stable thread ID that can be used by future messaging UIs.
- Attachments, notification delivery and retention enforcement remain separate slices; read receipts are recorded participant-only.
- A future provider can be swapped behind existing adapter boundaries without changing domain rules.

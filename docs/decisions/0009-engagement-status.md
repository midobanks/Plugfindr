# ADR 0009 — Engagement status updates

- Status: Accepted
- Date: 2026-11-24

## Context

Engagement status is self-reported by both parties through prompts in P1 (`ENG-14`). The existing
state machine is the source of allowed transitions, but a status update must also be authorised to a
party of that engagement.

## Decision

`packages/domain` exposes a party-checked status update that wraps the existing engagement state
machine. It derives the acting party from the engagement record rather than the request body and
records `completedAt` only on the `completed` transition. The `EngagementStore` port persists status
without storing contact details or message content. The web route requires a session, validates the
requested state, rate-limits updates and returns 503 while stores are unconfigured.

## Alternatives

- Trust a client-supplied party label: would allow either party to impersonate the other.
- Skip the state machine: would permit impossible histories such as hired before discussion.
- Log full engagement payloads on transition: would risk exposing private working details.

## Consequences

- Status history remains explainable and role-bound at the domain boundary.
- Completion timestamps are consistent with the terminal state.
- Status prompts, conversation threading and notification delivery remain separate slices.

# ADR 0013 - Reporting intake

- Status: Accepted
- Date: 2026-11-24

## Context

Businesses and specialists need a way to report a profile, message or behaviour, and reports must
reach a Trust and Safety queue with an SLA (`VER-9`). There is no admin queue UI, evidence storage
provider or moderation retention policy yet. Free-text reports would create a new store of personal
data before retention and access rules are agreed.

## Decision

Add a structured reporting intake for authenticated users. Targets are specialists, businesses or
messages; reasons are a fixed policy list. Message reports are accepted only from participants in
that conversation. Intake has no free-text field, is rate-limited per reporter, and returns only the
report ID, status and timestamps. Each open report receives a 24-hour first-response deadline.

Reports are stored through a `ReportStore` port with `open -> in_review -> resolved | dismissed`
transitions in the domain. The queue endpoint, reviewer notes, evidence attachments and admin UI
remain separate slices.

## Alternatives

- Accept free-text details at intake: useful context, but creates unmoderated personal data before
  retention and reviewer-access rules exist.
- Allow anonymous reports: easier to submit, but impossible to follow up or rate-limit reliably.
- Validate profile targets against live stores: stronger integrity, but the business-profile and
  specialist public stores are not connected yet.

## Consequences

- Reports carry identifiers and a policy reason only; message bodies are never copied.
- The 24-hour SLA is stored per report and can be surfaced by the future queue.
- Report retention, escalation, reviewer notes, evidence uploads and reporter status history remain
  open decisions.
- Until the queue is connected, reports are persisted by the adapter but not visible to reviewers.

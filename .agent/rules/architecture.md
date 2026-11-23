# Architecture Rules — Plugfindr

Applies to all code in this repository. Read with `AGENTS.md`, `PRD.md` and the sibling rules (`code-style.md`, `design-system.md`, `security.md`).

> Stack choices below are **[ASSUMED]** until confirmed. If the repo contradicts this file, the repo wins. Update this file when a decision is made.

---

## 1. Architectural goals

1. **Trust by construction.** Verification, visibility and contact-masking rules are enforced in the domain layer, not left to the UI.
2. **Swappable providers.** KYC, payments, messaging, search and storage can change without touching business logic.
3. **Human-assisted first, automatable later.** P1 matching is human-in-the-loop; the design must allow automated scoring (P2) without a rewrite.
4. **Lean and resilient on mobile networks.** Server-first rendering, small bundles, graceful degradation on slow or intermittent connections.
5. **Built to scale beyond Nigeria.** Currency, locale, time zone, regulation and verification rules are configurable, never hardcoded.

---

## 2. System shape

A **modular monolith** at launch: one deployable backend with strict internal module boundaries, plus web and admin front ends. Split into services only when a module has a proven scaling or ownership need.

```
          ┌───────────────┐   ┌────────────────┐
          │  Web app      │   │  Admin app     │
          │ (business +   │   │ (verification, │
          │  specialist)  │   │  matching,     │
          └──────┬────────┘   │  moderation)   │
                 │            └────────┬───────┘
                 ▼                     ▼
          ┌─────────────────────────────────────┐
          │            API / application layer   │
          │  (auth, validation, orchestration)   │
          └──────────────┬──────────────────────┘
                         ▼
          ┌─────────────────────────────────────┐
          │              Domain layer            │
          │ entities · rules · state machines    │
          └──────────────┬──────────────────────┘
                         ▼
   ┌───────────┬─────────┴──┬───────────┬──────────┐
   │ Postgres  │  Adapters  │  Object   │  Queue / │
   │           │ (KYC, pay, │  storage  │  jobs    │
   │           │ msg, search)│ (private)│          │
   └───────────┴────────────┴───────────┴──────────┘
```

### Layer rules

| Layer                 | May depend on                     | Must not                                                                  |
| --------------------- | --------------------------------- | ------------------------------------------------------------------------- |
| **UI (web/admin)**    | API client, `ui` package          | Import domain internals or DB code; contain business rules                |
| **API / application** | Domain, adapters (via interfaces) | Contain business rules that belong in domain; call provider SDKs directly |
| **Domain**            | Nothing but itself                | Import frameworks, HTTP, ORM, provider SDKs, or UI code                   |
| **Adapters**          | Domain types/interfaces           | Leak provider-specific types outward                                      |
| **Persistence**       | Domain types                      | Make business decisions                                                   |

Dependencies point **inward** (UI -> API -> domain). Never the reverse.

---

## 3. Repository layout **[ASSUMED]**

```
/apps
  /web              # Public site, business app, specialist app
  /admin            # Internal tools (RBAC-gated)
/packages
  /domain           # Entities, rules, state machines (framework-free)
  /ui               # Design system components + tokens
  /adapters         # kyc/, payments/, messaging/, search/, storage/
  /config           # Lint, TS, tooling config
/docs
  /decisions        # ADRs
.agent/rules        # Agent rules (this folder)
```

---

## 4. Domain modules

Each module owns its data, rules and public interface. Other modules call the interface, never the tables.

| Module            | Responsibility                                             | Key PRD refs       |
| ----------------- | ---------------------------------------------------------- | ------------------ |
| **identity**      | Accounts, auth (email, Google, phone OTP), sessions, roles | BIZ-1, SPC-1       |
| **business**      | Business profiles, team members (P2)                       | BIZ-2..5           |
| **specialist**    | Profiles, portfolio, credentials, availability             | PRF-*              |
| **taxonomy**      | Categories, skills, synonyms                               | ADM-4, DIS-2       |
| **discovery**     | Search, filters, ranking, saved lists                      | DIS-*              |
| **requests**      | "Tell us who you need" briefs and status                   | REQ-*              |
| **matching**      | Candidate generation, scoring, reasons, opt-in, feedback   | MAT-*              |
| **verification**  | Verification records, reviewer workflow, badges, expiry    | VER-*              |
| **engagement**    | Introductions, conversations, engagements, proposals (P2)  | ENG-*              |
| **payments** (P2) | Milestones, escrow-style holds, payouts, invoices          | ENG-11..13         |
| **reviews**       | Ratings, feedback, authenticity                            | ENG-15..17, VER-10 |
| **notifications** | Event -> channel routing, preferences                      | NOT-*              |
| **trust-safety**  | Reports, moderation, suspensions                           | VER-9              |
| **admin/ops**     | RBAC, audit log, dashboards, feature flags                 | ADM-*              |

Cross-module communication: direct calls through public interfaces for synchronous needs; **domain events** (e.g. `VerificationApproved`, `MatchOptedIn`, `IntroductionAccepted`) for side effects such as notifications, search indexing and analytics.

---

## 5. State machines

Model lifecycles explicitly in `/domain`. Transition functions validate, record who/why/when, emit an event, and throw on invalid transitions.

- **Request:** `submitted -> matching -> matches_ready -> in_conversation -> hired | closed`
- **Verification:** `not_started -> submitted -> in_review -> approved | rejected | needs_more_info -> expired`
- **Introduction:** `requested -> accepted | declined | expired`
- **Engagement:** `introduced -> in_discussion -> hired -> in_progress -> completed | not_proceeding`

No raw status strings scattered through code; use typed enums and transition functions.

---

## 6. Visibility and trust invariants (enforced in the domain/data layer)

1. A specialist is **discoverable and matchable only if** profile status is approved and required verifications are current.
2. **Badges are derived**, never stored as editable flags: computed from current, unexpired `Verification` records.
3. **Contact details** are returned only when an introduction is accepted and the specialist has allowed sharing (or an engagement is confirmed).
4. **Verification documents** are accessible only to authorised reviewers through audited, short-lived access paths. They never flow into business-facing APIs, search indexes or analytics.
5. **Match results** always carry reasons ("why this match") produced alongside the score.
6. **Ranking** inputs exclude payment status.

Enforce these with query-level filters, policies, and tests, not by hoping the frontend hides things.

---

## 7. Data and persistence

- **PostgreSQL** is the system of record. All changes via versioned migrations; never edit the DB manually or rewrite past migrations.
- Use **UUIDs** (or similarly opaque IDs) for public identifiers; never expose sequential IDs.
- Timestamps in **UTC** (`created_at`, `updated_at`); soft-delete (`deleted_at`) where audit or retention requires.
- Money: **integer minor units** (kobo) plus ISO currency code. Never floats.
- Separate **public profile data** from **private/sensitive data** (identity documents, ID numbers, verification notes) in different tables, with different access policies. Prefer separate storage for documents.
- Audit tables are **append-only**.
- Indexing is deliberate: justify indexes for search, filter and match queries; review query plans for hot paths. Avoid N+1 queries.
- Row-level access rules (or equivalent policy layer) for business, specialist, reviewer and admin roles.

### Core entities (high level)

`User`, `BusinessProfile`, `TeamMember`, `SpecialistProfile`, `Skill`, `Category`, `PortfolioItem`, `Credential`, `Verification`, `Request`, `Match`, `Introduction`, `Conversation`, `Message`, `Engagement`, `Proposal` (P2), `Transaction` (P2), `Review`, `Report`, `Notification`, `AuditLog`.

---

## 8. Search and discovery

- Start with Postgres full-text + trigram for typo tolerance, with a **synonym map** from the taxonomy (e.g. "UI/UX" ~ "product designer").
- Hide the engine behind a `SearchService` interface (`indexSpecialist`, `removeSpecialist`, `search(query, filters, sort)`), so a dedicated engine can replace it.
- Index **only discoverable, public fields**. Never index sensitive data.
- Keep the index in sync via domain events; make reindexing idempotent and re-runnable.
- Ranking = relevance + verification level + quality signals + activity/response. Explainable and unaffected by payment.
- Natural-language search (`DIS-6`) maps to structured filters through a parsing layer that can fail safely to keyword search.

---

## 9. Matching

- **P1:** a **matching workbench** for internal staff: request details beside ranked candidate suggestions with a scoring breakdown. A human approves what the business sees.
- **P2:** an automated scorer (skill overlap, category fit, industry experience, availability, budget, location/time zone, verification level, past performance, responsiveness) with human review for complex or high-value requests.
- Design the scorer as a **pure, deterministic function** of (request, candidate, context) returning `{score, reasons[], exclusions[]}`. This makes it testable, explainable and tunable.
- **Hard exclusions run before scoring:** unapproved, unavailable, blocked, conflicting, opted-out.
- Record business feedback (relevant/not relevant + reason) on every match to feed tuning.
- Include exposure/fairness controls (`MAT-7`) so new verified specialists are not starved.

---

## 10. Adapters and integrations

Every external dependency sits behind an interface in `/adapters`:

| Port                          | Responsibility                                | Notes                                                  |
| ----------------------------- | --------------------------------------------- | ------------------------------------------------------ |
| `KycProvider`                 | Submit and retrieve ID/liveness check results | Store results and references, not raw data beyond need |
| `PaymentsProvider` (P2)       | Charges, holds, releases, payouts, webhooks   | NGN first; abstract currency                           |
| `MessagingProvider`           | Email, SMS, WhatsApp, push                    | Respect consent and preferences                        |
| `SearchService`               | Index and query                               | See section 8                                          |
| `StorageProvider`             | Private object storage, signed URLs           | Verification docs in private buckets                   |
| `CalendarProvider` (optional) | Intro call scheduling                         |                                                        |

Adapter rules:

- Map provider responses into **internal types** immediately.
- Verify **webhook signatures**; handle webhooks **idempotently** (dedupe by event ID).
- Timeouts, retries with backoff, and circuit-breaking on every outbound call.
- Provide **fakes** for local development and tests. Tests never call live providers.

---

## 11. Async work and events

- Use a job queue for: notifications, search indexing, verification provider callbacks, expiry reminders, introduction timeouts, report triage.
- Jobs must be **idempotent**, retry-safe and observable (status, attempts, last error).
- Scheduled jobs: verification expiry and re-verification reminders, introduction expiry, response-SLA tracking.
- Prefer **transactional outbox** (write event with the state change, publish after commit) so events are never lost or duplicated.

---

## 12. API design

- Versioned HTTP API (`/v1/...`) or typed RPC; consistent resource naming using domain vocabulary (**specialist**, **business**, **request**, **match**, **introduction**, **engagement**).
- **Validate every input** at the boundary with a schema; reject unknown fields where safe.
- Authentication on all non-public routes; **authorisation checked per resource**, not only per route.
- Standard error shape: `{ code, message, details?, requestId }`. Messages are user-safe; internals stay in logs.
- Pagination (cursor-based) on all list endpoints; sensible default and max page sizes.
- Idempotency keys on create/payment-like operations.
- Rate limits on auth, OTP, search, messaging and request creation.
- Responses **never include sensitive fields by default**; use explicit response DTOs, never return raw DB rows.

---

## 13. Frontend architecture

- **Server-first rendering** for public and SEO pages (specialist profiles, category pages such as "Product designers in Lagos"); progressive enhancement for interactivity.
- Route-based code splitting; keep the initial JS budget small. Lazy-load below-the-fold and heavy components.
- Images: responsive sizes, modern formats, compression, explicit dimensions to avoid layout shift.
- Data fetching: server state via a query cache; minimal global client state.
- Forms: schema-validated (shared schemas with the API where possible), accessible, resilient to flaky connections (preserve drafts, retry gracefully).
- Offline/poor-network behaviour: clear states, no silent failures, optional PWA install and caching for static assets.
- All user-facing strings externalised for localisation; no hardcoded copy in components.
- Design tokens and components come from `/packages/ui` (see `design-system.md`).

---

## 14. Configuration and environments

- Environments: `local`, `preview`, `staging`, `production`. Production data never used outside production.
- Configuration via environment variables validated at startup (fail fast on missing or malformed config).
- **Feature flags** for phased capabilities (e.g. payments, automated matching, new verification tiers) and tunable thresholds (matches per request, SLA timers).
- Region, currency, locale, supported ID types and legal copy are **configuration**, so expansion beyond Nigeria is additive.

---

## 15. Observability and operations

- Structured logs with request IDs; **no PII, ID numbers, document contents, tokens or message bodies in logs**.
- Metrics aligned to the PRD: request-to-shortlist time, match relevance, intro acceptance and response times, verification throughput, report resolution time.
- Error monitoring and alerting with PII scrubbing.
- Health and readiness endpoints; graceful shutdown.
- Product analytics events use opaque IDs and exclude sensitive fields.
- **Audit log** for: admin actions, verification decisions, impersonation, suspensions, data access to sensitive records, and permission changes.

---

## 16. Performance and reliability targets

| Target                          | Value                        |
| ------------------------------- | ---------------------------- |
| Search p95                      | under 1.5 s                  |
| Page usable on typical 3G/4G    | under 3 s                    |
| Availability at launch          | 99.5% (aim 99.9%)            |
| Request -> first shortlist (P1) | within 24 h (human-assisted) |

Design for graceful degradation: if search, KYC or messaging providers fail, the core flows should degrade, queue and recover rather than lose data.

---

## 17. Architecture decision process

- Record significant decisions as short ADRs in `/docs/decisions/NNNN-title.md` (context, decision, alternatives, consequences).
- Ask the human before: choosing or swapping a KYC, payments, messaging or search provider; changing data collection/retention; altering ranking/matching in ways that affect exposure; splitting a service; adding a major dependency.
- Prefer boring, well-understood technology. Add complexity only against a measured need.

---

## 18. Anti-patterns (reject in review)

- Business rules in UI components or route handlers.
- Domain code importing frameworks, ORMs or provider SDKs.
- Provider-specific types leaking beyond adapters.
- Hardcoded currency, locale, country or ID-type assumptions.
- Status strings instead of state machines.
- Stored, editable "verified" booleans without a backing verification record.
- Returning raw database rows from APIs.
- Sensitive data in search indexes, logs, analytics or client bundles.
- Tests that call live third-party services.
- "Temporary" bypasses of authorisation, consent or audit logging.

# AGENTS.md — Plugfindr

Instructions for AI coding agents (and humans) working in this repository. Read this first, then `PRD.md` (what we build and why) and `BRAND_GUIDELINES.md` (how it looks and sounds).

> **Status note:** No codebase or stack has been confirmed yet. Sections marked **[ASSUMED]** are proposed defaults. If the repo contradicts them, **the repo wins**. Update this file when decisions are made. Commands marked `TODO` must be filled in once the project is scaffolded; never invent a command and present it as real.

---

## 1. Project overview

**Plugfindr** is a Nigeria-first specialist discovery and matching platform. Tagline: **"We know someone."**

- **Demand side (the paying customer):** businesses (startups, SMEs, corporate teams, agencies) that need independent specialists.
- **Supply side (the network):** vetted independent specialists (designers, developers, marketers, consultants, finance, creative, operations).
- **Core loop:** business says who they need -> matching produces a short, trusted shortlist -> introduction -> conversation -> engagement -> review.
- **Differentiator:** trust. Verification is tiered, visible and honest.

Product decisions default to the business user first. Phases: **P1** (human-assisted matching, verification v1, messaging, reviews), **P2** (automated matching, proposals, NGN payments), **P3** (multi-currency, expansion). Requirement IDs in `PRD.md` (e.g. `MAT-3`, `VER-7`) should be referenced in commits, PRs and tests.

---

## 2. Principles that override convenience

1. **Trust is the product.** Never display, store or imply a verification claim that hasn't actually happened.
2. **Privacy by design.** Identity documents and contact details are sensitive. Default to least exposure.
3. **Mobile-first, low-bandwidth-friendly.** Many users are on mid-range Android devices and variable connections.
4. **No pay-to-win ranking.** Ranking must never be influenced by payment (`DIS-9`).
5. **Human in the loop at P1.** Matching is human-assisted; build tools that help the matcher, not hidden automation.
6. **Ask before assuming** on anything legal, financial, identity-related or regulatory (see section 12).

---

## 3. Tech stack (confirmed 2026-11-22)

Provider choices (KYC, payments, messaging, search engine beyond Postgres) remain open; see section 17.

| Layer                   | Decision                                                                                              |
| ----------------------- | ----------------------------------------------------------------------------------------------------- |
| Frontend                | TypeScript, React, Next.js App Router, CSS design tokens from `packages/ui` (no Tailwind)             |
| Backend                 | TypeScript Next.js route handlers under `/v1`, Node.js on Vercel                                      |
| Database                | PostgreSQL with Prisma (relational data; full-text/trigram for early search)                          |
| Search                  | Start with Postgres; abstract behind a `SearchService` interface so it can move to a dedicated engine |
| Auth                    | Email, Google, and **phone OTP** (essential in the Nigerian market)                                   |
| Storage                 | Object storage with private buckets for verification documents                                        |
| Messaging/notifications | Email, in-app, web push, SMS, WhatsApp Business API                                                   |
| Payments (P2)           | Nigerian processor (e.g. Paystack or Flutterwave) via an adapter                                      |
| ID verification         | Third-party KYC provider behind an adapter                                                            |
| Hosting/CI              | Vercel (CI pipeline TBD)                                                                              |

**Rule:** every third-party dependency that touches money, identity or messaging goes behind an internal interface (adapter pattern) so providers can be swapped.

---

## 4. Setup and commands

```bash
# Install dependencies
npm install

# Generate the Prisma client (required before type-check)
npm run db:generate

# Run dev server
npm run dev

# Lint / format
npm run lint
npm run format:check
npm run format

# Type-check
npm run typecheck

# Unit + integration tests
npm test

# End-to-end tests
TODO: no E2E runner is configured yet

# Database migrations
npm run db:migrate -- --name <change-name>

# Seed local data (fake specialists/businesses only)
npm run db:seed
```

Before finishing any task, run lint, type-check and the relevant tests, and report the results honestly. If a command can't run in your environment, say so rather than claiming success.

---

## 5. Repository structure

```
/apps
  /web            # Public site, business app, specialist app
  /admin          # Internal tools: verification console, matching workbench, moderation
/packages
  /domain         # Entities, business rules, state machines (framework-free)
  /database       # Prisma schema, migrations, generated client, safe DTO mappers
  /ui             # Design system components and tokens
  /config         # Shared lint, TS, tooling config
  /adapters       # Provider ports and fakes: kyc, payments, messaging, search, storage
/docs
  /decisions      # ADRs
PRD.md
BRAND_GUIDELINES.md
AGENTS.md
```

Keep **domain logic framework-free** (no UI or HTTP imports in `/domain`) so it is testable and reusable.

---

## 6. Domain model and vocabulary

Use these terms consistently in code, UI and docs.

| Term             | Meaning                                                                                 |
| ---------------- | --------------------------------------------------------------------------------------- |
| **Business**     | Demand-side account (can have team members in P2)                                       |
| **Specialist**   | Supply-side independent professional                                                    |
| **Request**      | A business's "Tell us who you need" brief                                               |
| **Match**        | A specialist proposed for a request, with a score and "why this match" reasons          |
| **Introduction** | A business's request to connect with a specialist; specialist accepts or declines       |
| **Engagement**   | A working relationship that results from an introduction                                |
| **Verification** | A typed, time-bound check (identity, contact, portfolio, credentials, reference, skill) |
| **Badge**        | Public representation of a completed verification                                       |
| **Review**       | Rating and feedback from a party to a completed engagement                              |

Avoid synonyms in identifiers (`freelancer`, `vendor`, `client`, `provider`, `candidate`). Use **specialist** and **business**.

### State machines (implement explicitly, not as ad hoc strings)

- **Request:** `submitted -> matching -> matches_ready -> in_conversation -> hired | closed`
- **Verification:** `not_started -> submitted -> in_review -> approved | rejected | needs_more_info -> expired`
- **Introduction:** `requested -> accepted | declined | expired`
- **Engagement:** `introduced -> in_discussion -> hired -> in_progress -> completed | not_proceeding`

Transitions must be validated in the domain layer, logged, and covered by tests. Invalid transitions throw; they never silently no-op.

---

## 7. Hard business rules (never violate)

1. **Only approved specialists are discoverable and matchable.** Unverified or pending profiles are private (`VER-4`).
2. **Verification claims must be truthful and explainable.** A badge must map to a real, current `Verification` record. Expired verifications remove the badge.
3. **Identity documents are never shown to businesses**, never logged, never put in analytics, and are stored encrypted with strict access control (`VER-7`).
4. **Contact details stay masked** until the specialist shares them or an engagement is confirmed (`ENG-5`).
5. **Specialist opt-in before a match is final** (`MAT-4`). Don't present a specialist as a confirmed match without it.
6. **Every match shows "Why this match"** (2 to 3 plain-language reasons) (`MAT-3`).
7. **Ranking is not purchasable** and must be explainable (`DIS-9`).
8. **Conflict and block rules are respected** in matching (`MAT-8`).
9. **Reviews come only from parties to a completed engagement** once that is supported (`VER-10`).
10. **All sensitive admin actions are role-checked and audit-logged** (`ADM-7`).

---

## 8. Coding standards

### General

- Prefer **TypeScript with strict mode**. No `any` without a comment justifying it.
- Small, pure functions for business rules; side effects at the edges.
- Validate all external input at the boundary with a schema validator (e.g. Zod). Never trust client data.
- Use explicit return types on exported functions.
- No dead code, commented-out blocks, or unexplained TODOs. TODOs must reference an issue or PRD requirement ID.
- Prefer composition over inheritance; avoid premature abstraction, but do abstract providers (section 3).

### Naming

- Files and folders: `kebab-case`. Components: `PascalCase`. Functions and variables: `camelCase`. Constants: `UPPER_SNAKE_CASE`. DB tables and columns: `snake_case`.
- Booleans read as questions: `isVerified`, `hasAcceptedIntro`.
- Currency amounts are **integers in minor units** (kobo) with an ISO currency code. Never floats.

### Dates, time and locale

- Store timestamps in **UTC**; display in the user's time zone (default `Africa/Lagos`).
- Default currency **NGN**; format as `₦250,000`. Design for multi-currency from the start (`P3`).
- Default locale `en-NG`. Externalise all user-facing strings for future localisation (Yoruba, Igbo, Hausa, Pidgin, French). No hardcoded copy scattered through components.
- Names, bios and text fields must support **Unicode and combining diacritics** (e.g. `ẹ`, `ọ`, `ṣ`). Test with them.

### Errors and logging

- Return typed, user-safe error messages; log technical details server-side.
- **Never log PII, tokens, ID numbers, document contents, or message bodies.** Use opaque IDs.
- Use structured logging with request IDs.

### Database

- All schema changes via migrations. Never edit the database by hand or alter past migrations.
- Add indexes for search and filter fields deliberately; justify them in the PR.
- Soft-delete users and records where retention or audit is required; hard-delete only per the data retention policy.

---

## 9. Security and privacy

- Treat the following as **sensitive**: government IDs (NIN, BVN, passport, licence), ID images and liveness data, phone numbers, emails, message content, payment data, and verification notes.
- **Never** commit secrets, keys or real personal data. Use environment variables and a secrets manager. Ship a `.env.example` with placeholder values only.
- Encrypt sensitive data at rest and in transit; restrict access by role (least privilege).
- Require MFA for admin and verification-reviewer roles.
- Implement rate limiting on auth, OTP, search, messaging and request creation.
- Sanitise and escape user-generated content (bios, portfolios, messages, reviews). Guard against XSS, CSRF, SSRF, injection and insecure file uploads (validate type, size, scan, store outside web root).
- Presigned, short-lived URLs for private files. Verification documents must never be publicly addressable.
- Comply with **Nigerian data protection law (NDPA 2023 / NDPR)**: capture explicit consent for identity data, support access, correction and deletion requests, and respect the retention policy. Ask before changing how personal data is collected, shared or retained.
- **Test data must be fake.** Never use real people's identities, IDs, phone numbers or photos in fixtures, seeds or screenshots.

---

## 10. Product and UX rules

- **Trust visible at the decision point:** show verification badges, ratings, response time and "Why this match" on results and profiles.
- **Badges are labelled and explainable.** Pair icon with text ("Identity verified"). Clicking a badge explains what was checked and when. Never use an icon-only trust mark.
- **Short paths:** the request flow ("Tell us who you need") should complete in about 3 minutes. Use progressive disclosure.
- **Empty and low-result states** offer to switch to request-a-match (`DIS-10`).
- **Mobile-first:** tap targets at least 44 px, light pages, resilient to slow or intermittent connections. Compress images; lazy-load; avoid heavy client bundles.
- **WhatsApp is a first-class channel** for notifications and sharing. Build deep links and share cards accordingly.
- **Accessibility:** target **WCAG 2.1 AA**. Keyboard navigation, visible focus, labels on all inputs, alt text, no colour-only meaning, respect `prefers-reduced-motion`.

---

## 11. Brand and design implementation

Full detail is in `BRAND_GUIDELINES.md`. The essentials for code:

### Colour tokens

```css
--pf-green: #0b6b3a; /* primary brand */
--pf-ink: #10231a; /* primary text on light */
--pf-deep: #0b3d26; /* dark mode background */
--pf-mint: #7bd3a0; /* accent on dark */
--pf-amber: #f5a623; /* the spark: used sparingly */
--pf-warm-white: #f7f5ef; /* soft light / text on dark */
--pf-white: #ffffff;
```

- Use **semantic tokens** (`--bg`, `--text`, `--brand`, `--accent`, `--border`) in components, not raw hex.
- Support **light and dark mode** via tokens and `prefers-color-scheme`.
- **Amber is an accent, never body text.** Amber text on white fails contrast (~2:1). Use Ink text on amber backgrounds.
- Mint on Plug Green and Amber on Plug Green are for large graphics only, not small text.
- Typefaces **[recommended]:** Plus Jakarta Sans (headlines/UI), Inter (body). Verify diacritic support.
- Rounded corners: 8 px inputs/chips, 12 to 16 px cards, pills for badges/avatars.

### Logo

- Use the supplied **SVG** files. Never recreate, recolour, stretch, outline, or re-typeset the logo. Never use the JPGs in product (low-resolution, flattened).
- Light-mode logo on light backgrounds; dark-mode logo on dark backgrounds.
- The wordmark is lowercase `plugfindr` with a two-tone split (`plug` / `findr`). In running text, write **Plugfindr**.
- Request transparent, cropped SVG exports if only background-carded versions exist; do not crop or edit paths yourself.

### Copy and voice

- Conversational, confident, plain. Nigerian-inspired but globally understandable. Sentence case for headlines and buttons.
- Use approved lines:
  - Master tagline: **We know someone**
  - Campaign tagline: **Find the right plug**
  - CTA: "Tell us who you need", "Meet your next specialist", "Find your plug"
- Don't invent new taglines. Don't stack taglines together.
- Use "specialist" and "business". Avoid "resource", "vendor", "service provider", "leverage", "solutions".
- Keep slang **out of** legal, payments, safety and verification copy. Say it plainly there.
- Never write "verified" or "vetted" unless it is literally true and explainable.
- Currency: `₦250,000`. Dates: unambiguous (e.g. `12 Mar 2027`).

---

## 12. Ask first / never do

### Ask the human before you:

- Choose or change an identity-verification, payments, messaging or search provider.
- Change how personal or identity data is collected, stored, shared or retained.
- Add or alter anything related to escrow, payouts, fees or commissions.
- Change ranking or matching logic in ways that affect exposure or fairness.
- Add a new third-party script, SDK, tracker or analytics tool.
- Introduce a new brand colour, typeface, tagline or logo treatment.
- Write legal text (terms, privacy policy, agreements). Draft only if asked, and flag for legal review.
- Make schema changes that drop or rewrite existing data.

### Never:

- Hardcode secrets, API keys or real personal data.
- Log or expose PII, ID numbers, document contents or message bodies.
- Fake, simulate or hardcode verification status, badges, reviews or ratings in production code paths.
- Bypass role checks, rate limits, consent checks or audit logging.
- Display a specialist as discoverable or matched if they are not approved.
- Add pay-to-rank behaviour.
- Scrape or import real people's data without a documented lawful basis and consent.
- Disable tests, lint rules or type checks to make a task pass.
- Rewrite or "improve" files unrelated to the task.

---

## 13. Testing expectations

- **Domain rules and state machines:** unit tests for every transition and every rule in section 7, including invalid transitions.
- **Matching:** tests that unapproved, blocked, conflicting or unavailable specialists are excluded; that every match includes reasons; that scoring is deterministic for fixed inputs.
- **Verification:** tests for status transitions, expiry, badge derivation and access control on documents.
- **Privacy:** tests that contact details stay masked until permitted and that sensitive fields never appear in API responses, logs or analytics events.
- **Search/discovery:** tests for typo tolerance, synonyms, filters, empty states.
- **Accessibility:** automated checks (e.g. axe) on key flows plus manual keyboard review.
- **E2E (critical paths):** business request -> shortlist -> introduction -> conversation; specialist onboarding -> verification submitted -> approved -> discoverable.
- **Fixtures:** use clearly fake, Nigerian-context data (names, cities such as Lagos, Abuja, Port Harcourt, Kano, Ibadan) including names with diacritics. No real people.
- New behaviour requires tests. Bug fixes require a regression test.

---

## 14. Performance targets

- Search results p95 under **1.5 s**.
- Pages usable under **3 s** on typical 3G/4G.
- Keep initial JS small; split bundles by route; optimise and lazy-load images; cache aggressively where safe.
- Avoid N+1 queries; review query plans for search and matching.

---

## 15. Git, PRs and documentation

- **Branches:** `type/short-description` (e.g. `feat/request-a-match-form`, `fix/badge-expiry`).
- **Commits:** Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`). Reference PRD IDs where relevant (e.g. `feat(matching): show why-this-match reasons (MAT-3)`).
- **PRs:** small and focused. Include: what changed, why, requirement IDs, screenshots for UI (light and dark), test results, and any privacy or security implications.
- **Docs:** update `PRD.md`, `BRAND_GUIDELINES.md` or this file when behaviour or decisions change. Record significant decisions in `/docs/decisions` as short ADRs.
- **Definition of done:** tests pass, lint and types clean, accessible, mobile-checked, no new PII exposure, copy matches voice guidelines, docs updated.

---

## 16. Working as an agent

1. **Read before writing.** Check existing code, `PRD.md` and `BRAND_GUIDELINES.md` first.
2. **Make the smallest correct change.** Match existing patterns and conventions.
3. **State assumptions.** If something is ambiguous, say what you assumed or ask. Don't guess on sections 7, 9 or 12 topics.
4. **Verify.** Run the checks in section 4 and report actual results. Don't claim tests passed if you didn't run them.
5. **Surface risks.** Flag privacy, security, fairness or trust implications even if not asked.
6. **Stay in scope.** Note unrelated problems rather than fixing them silently.
7. **Don't fabricate.** No invented APIs, provider behaviour, legal claims, metrics or test data presented as real.

---

## 17. Open decisions (track here until resolved)

- [ ] Final tech stack and hosting
- [ ] ID verification provider for Nigerian IDs
- [ ] Payments / escrow structure and partner (P2)
- [ ] Search engine beyond Postgres
- [ ] Launch categories and minimum supply per category
- [ ] Policy and enforcement for off-platform contact before payments exist
- [ ] First monetisation model (match fee, commission, subscription)
- [ ] Typeface confirmation for brand and UI
- [ ] Transparent/cropped logo exports and approved tagline lockups
- [ ] Data retention periods and DPO/compliance owner

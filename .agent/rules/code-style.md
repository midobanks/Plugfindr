# Code Style Rules — Plugfindr

Conventions for writing, reviewing and committing code. Read with `AGENTS.md` and `architecture.md`.

> Language and tooling below are **[ASSUMED]** (TypeScript, React, Postgres). If the repo's existing config (formatter, linter, tsconfig) differs, **the repo wins**. Never reformat unrelated code.

---

## 1. Core principles

1. **Clarity over cleverness.** Code is read far more than written.
2. **Smallest correct change.** Match surrounding patterns; don't refactor what you weren't asked to touch.
3. **Domain language everywhere.** Use the product's vocabulary consistently.
4. **Make illegal states unrepresentable.** Use types, enums and state machines instead of loose strings and booleans.
5. **Tests ship with code.** New behaviour needs tests; bug fixes need a regression test.

---

## 2. Domain vocabulary (use in names, comments, UI, docs)

| Use                      | Avoid                                                            |
| ------------------------ | ---------------------------------------------------------------- |
| `specialist`             | freelancer, provider, vendor, candidate, talent (in identifiers) |
| `business`               | client, customer, company (in identifiers)                       |
| `request`                | job, gig, ticket                                                 |
| `match`                  | recommendation, suggestion (in identifiers)                      |
| `introduction`           | lead, connection request                                         |
| `engagement`             | contract, job (until P2 agreements exist)                        |
| `verification` / `badge` | check, certificate                                               |

Brand name in text: **Plugfindr**. In code identifiers and namespaces: `plugfindr` or `pf` (e.g. `--pf-green`).

---

## 3. TypeScript

- `strict: true`. Also enable `noUncheckedIndexedAccess`, `noImplicitOverride`, `exactOptionalPropertyTypes` where practical.
- **No `any`.** If unavoidable, use `unknown` and narrow, or add `// eslint-disable-next-line` with a reason.
- No non-null assertions (`!`) without a justification comment.
- Explicit return types on **exported** functions and public module interfaces.
- Prefer `type` for unions and data shapes, `interface` for object contracts meant to be implemented/extended.
- Model variants as **discriminated unions**; handle with exhaustive `switch` and a `never` check.
- Use `readonly` and immutable patterns by default; avoid mutating inputs.
- Prefer **branded types** for IDs and money (`SpecialistId`, `BusinessId`, `Kobo`) to prevent mix-ups.
- Use `async/await`, not raw promise chains; always handle rejections; never leave floating promises.
- Use `import type` for type-only imports.
- No default exports except where a framework requires them (e.g. route files). Prefer named exports.
- No barrel files that create circular dependencies; keep imports acyclic.

### Validation

- Validate all external input (HTTP, webhooks, env, queue payloads, provider responses) with a schema validator (e.g. Zod) at the boundary, then use inferred types inside.
- Share schemas between client and server where it avoids drift.

---

## 4. Naming

| Thing                            | Convention                                    | Example                          |
| -------------------------------- | --------------------------------------------- | -------------------------------- |
| Files and folders                | `kebab-case`                                  | `request-a-match-form.tsx`       |
| React components, classes, types | `PascalCase`                                  | `SpecialistCard`, `MatchReason`  |
| Functions, variables, methods    | `camelCase`                                   | `approveVerification`            |
| Constants                        | `UPPER_SNAKE_CASE`                            | `MAX_MATCHES_PER_REQUEST`        |
| Enum members / union literals    | `snake_case` string values                    | `'in_review'`                    |
| DB tables and columns            | `snake_case`, plural tables                   | `specialist_profiles.created_at` |
| Env vars                         | `UPPER_SNAKE_CASE`, prefixed by area          | `KYC_PROVIDER_API_KEY`           |
| Events                           | Past tense `PascalCase`                       | `VerificationApproved`           |
| CSS custom properties            | `--pf-*` (brand), semantic (`--bg`, `--text`) | `--pf-green`                     |

Rules:

- **Booleans read as questions:** `isVerified`, `hasAcceptedIntro`, `canMessage`.
- **Functions are verbs;** getters that compute are `getX`, predicates are `isX`/`hasX`/`canX`.
- No abbreviations except widely understood ones (`id`, `url`, `kyc`, `ngn`). No single-letter names outside tiny loops/lambdas.
- Test names describe behaviour: `it('excludes unapproved specialists from matches')`.

---

## 5. Structure and size

- One primary concept per file. Co-locate tests, styles and types with the code they serve.
- Functions: aim for under ~40 lines and a single responsibility. Extract when a function mixes levels of abstraction.
- Components: aim for under ~200 lines; extract subcomponents and hooks when they grow.
- Limit parameters; use an options object beyond three.
- Avoid deep nesting; prefer guard clauses and early returns.
- Keep **business rules in `/domain`**, orchestration in the application layer, and rendering in UI (see `architecture.md`).
- Don't duplicate logic. Extract only after the **third** repetition, and only if the abstraction is obvious.

---

## 6. React and frontend code

- **Function components and hooks only.**
- Server components / server rendering by default for content pages; add client interactivity only where needed.
- Keep components **presentational**; push data fetching and rules into hooks/services.
- State: local state first, server state via a query cache, minimal global state.
- `useEffect` is a last resort; derive values during render, handle events in handlers.
- Always provide stable `key`s from IDs, never array indexes for dynamic lists.
- Memoise only when measured; don't prematurely optimise.
- **All user-facing strings come from the i18n layer**; no hardcoded copy in components.
- Forms: schema-validated, labelled, accessible, preserve drafts on failure, disable double-submit.
- Style with design tokens and the `ui` package (see `design-system.md`). No raw hex values in components.
- Images: explicit width/height, responsive sources, lazy-load below the fold, meaningful `alt`.
- Avoid heavy dependencies; check bundle impact before adding a library.

---

## 7. Backend and data code

- Thin handlers: parse -> authorise -> call application service -> map to response DTO.
- **Authorise per resource**, not just per route.
- Return explicit **response DTOs**; never return raw DB rows.
- Wrap multi-step writes in transactions; emit events via the outbox pattern.
- All schema changes are **migrations**; never edit past migrations or touch the DB manually.
- **Money:** integer minor units (kobo) with ISO currency code. Never floats.
- **Time:** store UTC; format at the edge using the user's time zone (default `Africa/Lagos`).
- Use parameterised queries / the query builder; no string-concatenated SQL.
- Avoid N+1 queries; justify new indexes in the PR.
- Idempotency keys for create and payment-like operations; idempotent webhook and job handlers.

---

## 8. Errors and logging

- Throw **typed errors** (e.g. `DomainError`, `ValidationError`, `NotFoundError`, `ForbiddenError`) with stable `code`s.
- Never swallow errors. Catch only to add context, recover meaningfully, or translate at a boundary.
- User-facing messages are plain, kind and actionable, in brand voice where appropriate (but plain for payments, legal, safety and verification).
- Log with structure (`level`, `requestId`, `event`, opaque IDs).
- **Never log:** PII, phone numbers, emails, ID numbers, document contents, tokens, secrets, message bodies.
- No `console.log` in committed code; use the logger.

---

## 9. Comments and documentation

- Code explains **what**; comments explain **why** (trade-offs, business rules, regulatory reasons).
- Reference PRD IDs next to rules they implement: `// VER-4: only approved specialists are discoverable`.
- Document public functions and modules with short JSDoc/TSDoc when behaviour isn't obvious from types.
- No commented-out code. No stale comments.
- TODOs must include an owner or issue/PRD reference: `// TODO(MAT-7): add exposure balancing`.
- Update `PRD.md`, `BRAND_GUIDELINES.md`, `AGENTS.md` or ADRs when behaviour or decisions change.

---

## 10. Copy, strings and localisation in code

- Externalise every user-facing string; keys are stable and descriptive (`request.form.cta`).
- Support **Unicode with combining diacritics** end to end (`ẹ`, `ọ`, `ṣ`, `ń`). Never normalise away or strip tone marks in storage; normalise only for comparison/search.
- Use the Intl APIs for dates, numbers and currency. Default locale `en-NG`, currency `NGN`, displayed as `₦250,000`.
- Sentence case for headings, buttons and labels.
- Approved lines and voice rules live in `BRAND_GUIDELINES.md`; don't invent new taglines.
- Don't claim "verified" or "vetted" in copy unless a backing verification exists.

---

## 11. Testing style

- **Arrange / Act / Assert**, one behaviour per test, descriptive names.
- Unit-test domain rules and every state-machine transition (valid and invalid).
- Integration-test API routes, authorisation and data policies.
- E2E only for critical paths: request -> shortlist -> introduction -> conversation; specialist onboarding -> verification -> discoverable.
- Test **negative paths**: unapproved specialists excluded, contact details masked, expired verifications drop badges, unauthorised access rejected.
- Use **fakes** for adapters; never hit live third-party services.
- **Fixtures use fake, Nigerian-context data** (Lagos, Abuja, Port Harcourt, Kano, Ibadan; names including diacritics). No real people, IDs, numbers or photos.
- Tests must be deterministic: control time, randomness and IDs.
- Don't delete, skip or weaken tests to make a change pass.
- Accessibility: automated checks (e.g. axe) on key screens plus keyboard review.

---

## 12. Formatting and tooling

- Use the repo's formatter (e.g. Prettier) and linter (e.g. ESLint) configs; don't hand-format against them.
- Typical defaults **[ASSUMED]**: 2-space indent, single quotes, semicolons, trailing commas, 100-character line width, LF line endings, UTF-8.
- Import order: built-ins, external packages, internal aliases, relative; separated by blank lines.
- Run before finishing: format, lint, type-check, relevant tests. Report actual results; never claim success you didn't observe.
- Don't disable lint rules or type checks to get past errors; fix the cause or ask.

---

## 13. Git and PR conventions

- **Branches:** `type/short-description` (e.g. `feat/request-a-match-form`, `fix/badge-expiry`).
- **Commits:** Conventional Commits with optional scope and PRD ref.
  - `feat(matching): show why-this-match reasons (MAT-3)`
  - `fix(verification): drop badge when verification expires (VER-6)`
  - `docs: update brand guidelines colour tokens`
- Keep commits and PRs **small and focused**. One concern per PR.
- PR description includes: what and why, PRD requirement IDs, screenshots (light **and** dark) for UI, test results, and any privacy/security implications.
- **Definition of done:** tests pass, lint and types clean, accessible, mobile-checked, no new PII exposure, copy matches voice, docs updated.

---

## 14. Dependencies

- Prefer the standard library and existing dependencies. Justify each new package (purpose, size, maintenance, licence, security record).
- Pin versions via lockfile; keep dependencies updated; avoid abandoned packages.
- Ask before adding any third-party script, SDK, tracker or analytics tool, or anything touching identity, money or messaging.

---

## 15. Quick checklist (before you finish)

- [ ] Uses domain vocabulary (**specialist**, **business**, **request**, **match**)
- [ ] Types strict; no stray `any`, `!`, or floating promises
- [ ] Business rules in `/domain`; input validated at the boundary
- [ ] No PII/secrets in code, logs, fixtures or analytics
- [ ] Money in kobo; time in UTC; strings externalised
- [ ] Tests added/updated, including negative paths; none skipped
- [ ] Format, lint, type-check, tests actually run and reported
- [ ] Commit/PR conventions followed, PRD IDs referenced
- [ ] No unrelated changes

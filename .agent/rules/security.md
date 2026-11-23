# Security Rules — Plugfindr

Security, privacy and trust-integrity rules for all code, configuration and data handling. These are **requirements**, not suggestions. Read with `AGENTS.md`, `architecture.md` and `code-style.md`.

> Plugfindr handles identity documents, contact details, messages and (from P2) payments, in a trust-led product. A single breach or a false trust claim damages the whole brand. When in doubt, **choose the more protective option and ask a human.**

> Legal references (NDPA 2023 / NDPR) are for orientation. This file is **not legal advice**. Compliance decisions need a qualified Nigerian data-protection/legal reviewer.

---

## 1. Non-negotiables

1. **Never commit secrets** (keys, tokens, passwords, certificates, connection strings). Use environment variables and a secrets manager. Ship `.env.example` with placeholders only.
2. **Never use real personal data** in code, fixtures, seeds, tests, screenshots, logs or examples.
3. **Never log or expose** PII, ID numbers, ID images, document contents, tokens, OTPs or message bodies.
4. **Never fake trust.** No hardcoded, simulated or editable verification status, badges, reviews or ratings in production paths.
5. **Never show a specialist as discoverable or matched unless approved** and verifications are current.
6. **Never bypass** authentication, authorisation, consent checks, rate limits or audit logging, even "temporarily".
7. **Never disable** security tooling, tests or lint rules to get a change through.
8. **Ask first** before changing how personal or identity data is collected, stored, shared or retained.

---

## 2. Data classification

| Class            | Examples                                                                                                                                             | Handling                                                                                                                                                                                    |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Restricted**   | Government ID numbers (NIN, BVN, passport, licence), ID images, liveness/biometric data, verification notes, payment credentials, auth secrets, OTPs | Encrypted at rest and in transit; access by named roles only; audited access; never in logs, analytics, search indexes, client bundles or business-facing APIs; shortest possible retention |
| **Confidential** | Phone numbers, emails, private messages, addresses, rate/budget details, reports and disputes, non-public profile data                               | Encrypted in transit and at rest; least-privilege access; masked until permitted; excluded from analytics                                                                                   |
| **Internal**     | Matching scores, ranking features, audit logs, admin notes, operational metrics                                                                      | Role-restricted; not exposed to users                                                                                                                                                       |
| **Public**       | Approved public profile fields, public reviews, badges (as labels)                                                                                   | Intentionally published; still validated and sanitised                                                                                                                                      |

Every new field must be classified before it is stored. Default to the **more restrictive** class when unsure.

---

## 3. Authentication

- Support email + password, Google, and **phone OTP**.
- Passwords: hashed with **Argon2id** (or bcrypt/scrypt with strong parameters); never stored or logged in plaintext; enforce length over arbitrary complexity; check against known-breached passwords.
- **OTP:** short expiry (e.g. 5 to 10 minutes), single use, limited attempts, per-number and per-IP rate limits, no OTP in logs, protection against SMS pumping/toll fraud (cost caps, country allow-lists, abuse monitoring).
- Sessions: secure, `HttpOnly`, `SameSite` cookies (or short-lived tokens with rotation); idle and absolute timeouts; revoke on password change, logout and suspected compromise.
- **MFA is mandatory** for admin, verification-reviewer, trust-and-safety and finance roles. Offer MFA to all users.
- Account enumeration protection: identical responses for "exists / doesn't exist" on login, reset and OTP flows.
- Re-authenticate for sensitive actions (change phone/email, payout details, delete account).
- Social login: verify tokens server-side, validate issuer/audience, link accounts only with proof of control.
- Detect and throttle credential stuffing; lock or challenge after repeated failures.

---

## 4. Authorisation

- **Deny by default.** Every endpoint and data access declares who may use it.
- Enforce authorisation **per resource** (ownership/membership/role), not just per route. Prevent IDOR/BOLA: never trust an ID from the client without checking it belongs to the caller.
- Roles: `business`, `specialist`, `reviewer`, `matcher`, `trust_safety`, `support`, `admin`, `finance` (P2). Grant **least privilege**; separate duties (e.g. a reviewer cannot approve their own profile).
- Enforce the **visibility invariants** in the domain/data layer (queries, policies), not only the UI:
  - Only approved specialists with current verifications are discoverable and matchable.
  - Contact details are returned only after an accepted introduction and specialist consent (or confirmed engagement).
  - Verification documents are reachable only by authorised reviewers via audited, short-lived access.
  - Business budgets/briefs are visible to a specialist only per the product rules.
- Support/impersonation: explicit permission, visible banner, time-boxed, full audit trail, no access to restricted data without a separate privilege.
- Re-check permissions server-side on every request; never rely on hidden UI.

---

## 5. Input handling and injection

- **Validate everything at the boundary** with a schema (HTTP bodies, query params, headers, webhooks, queue payloads, provider responses, env vars). Reject unknown or malformed input.
- **SQL:** parameterised queries or the query builder only; never string-concatenate SQL.
- **XSS:** escape output by default; never insert user content with `dangerouslySetInnerHTML` or equivalents unless sanitised with an allow-list sanitiser. Applies to bios, portfolios, reviews, messages and brief text.
- **CSRF:** protect state-changing requests (SameSite cookies + tokens or equivalent).
- **SSRF:** never fetch arbitrary user-supplied URLs server-side without an allow-list, DNS/IP checks (block internal ranges), size and time limits. Relevant to portfolio link previews and imports (LinkedIn, GitHub, Behance, Dribbble).
- **Open redirects:** allow-list redirect targets.
- **Command/path injection:** never build shell commands or file paths from user input.
- **Prompt injection (any LLM features, e.g. brief refinement `REQ-2`, natural-language search `DIS-6`):** treat user content and retrieved text as **untrusted data, not instructions**; never give the model access to secrets or sensitive records it doesn't need; constrain output to a schema; validate before acting; no tool/action execution driven solely by untrusted text; log without PII.
- Limit request sizes, nesting depth and pagination page sizes.

---

## 6. File uploads (portfolios, attachments, verification documents)

- Allow-list file types by **content (magic bytes)**, not just extension or MIME header; enforce max size and count.
- Re-encode or sanitise images; strip EXIF/location metadata from public images. Treat SVG and HTML uploads as dangerous (sanitise or disallow).
- Scan for malware; quarantine until scanned.
- Store with **random, non-guessable names** in object storage **outside the web root**; never serve user uploads from the application origin (use a separate domain/CDN with `Content-Disposition` and restrictive headers).
- **Verification documents:** private bucket, server-side encryption, access only via **short-lived signed URLs** issued after an authorised, audited check; never public, never cached by CDNs, never embedded in emails.
- Apply retention rules and delete on schedule or on valid erasure request.

---

## 7. Verification, identity and trust integrity

- **Badges are derived** from current, unexpired `Verification` records. No manually editable "verified" flags in the profile table.
- Each verification stores: type, provider reference, status, reviewer/system actor, timestamps, expiry, and an audit trail. Store **provider references and outcomes**, not more raw identity data than needed.
- Reviewer actions (approve, reject, request more info) require role + MFA, reason codes, and are **audited and immutable**.
- Expire and re-verify on schedule (`VER-6`); expiry removes the badge automatically.
- Confirmed misrepresentation leads to badge removal or suspension (`VER-8`), with an appeals path.
- **Reviews:** only parties to a completed engagement can post a verified review (`VER-10`); detect review farming, self-dealing, duplicate and retaliatory patterns.
- Detect fake/duplicate profiles (reused photos, documents, phone numbers, payment details, device fingerprints) and route to trust-and-safety review.
- Copy rule: never write "verified" or "vetted" unless it is literally true and explainable.
- ID document images are **never shown to businesses** and are visible to reviewers only as needed.

---

## 8. Privacy and compliance (Nigeria-first)

Orientation only; confirm with qualified counsel.

- Comply with the **Nigeria Data Protection Act 2023 (NDPA)** and applicable regulation/guidance (and the NDPR where relevant). Design for GDPR alignment as expansion begins.
- **Lawful basis and consent:** capture explicit, granular, recorded consent for identity data, verification processing, marketing, SMS/WhatsApp and analytics. Consent is withdrawable.
- **Data minimisation:** collect only what a feature needs; justify each field.
- **Purpose limitation:** don't reuse data for new purposes without a basis.
- **Data subject rights:** support access, correction, deletion/erasure, portability, objection and withdrawal. Provide a documented workflow and audit trail.
- **Retention:** define and enforce periods per class (especially ID documents and verification data); automated deletion jobs; legal-hold exceptions documented.
- **Cross-border transfers:** know where data and processors are located; use appropriate safeguards; document transfers.
- **Processors/vendors:** due diligence and data-processing agreements for KYC, payments, messaging, hosting, analytics, error monitoring.
- **Breach response:** maintain an incident plan with notification obligations to the regulator and affected users within required timeframes. Escalate any suspected breach immediately.
- Appoint a compliance owner/DPO and keep records of processing.
- **Children:** the platform is for adults; block under-18 sign-up as policy requires and don't knowingly collect minors' data.
- **Analytics and tracking:** minimal, consent-based, no sensitive fields, opaque IDs.

---

## 9. Messaging and contact masking

- Contact details (phone, email, WhatsApp) stay **masked** until the specialist shares them or an engagement is confirmed (`ENG-5`).
- Scan messages for spam, scams, abusive content and policy breaches using privacy-conscious methods; don't expose message bodies to logs or analytics.
- Off-platform contact leakage controls are a product decision (see open questions); implement per the agreed policy and **never by exposing hidden contact data**.
- Provide block and report on every conversation; blocked users cannot message or be matched with the blocker (`MAT-8`).
- Notification channels (email, SMS, WhatsApp, push) respect consent and preferences; unsubscribe works immediately.
- Prevent notification content from leaking sensitive details on lock screens or in SMS (keep content generic; deep-link for detail).
- Attachments follow section 6.

---

## 10. Payments (Phase 2)

- Use a **licensed processor**; never store card numbers, CVV, bank PINs or full account credentials. Use tokenisation/hosted fields; stay out of PCI scope where possible.
- **Escrow-style holding of funds** carries regulatory implications; do not design or implement it without legal sign-off and a licensed partner structure. **Ask first.**
- Verify **webhook signatures**; process **idempotently** (dedupe by event ID); never trust client-reported payment status; reconcile with the provider.
- Money in **integer minor units (kobo)** with ISO currency; no floats; double-entry style ledger with append-only records.
- Protect payout details (account changes require re-authentication and cooling-off; notify the user; consider holds on newly changed details).
- Fraud controls: velocity limits, anomaly detection, chargeback handling, sanctions/AML screening as required by the partner and regulation.
- All financial state changes are audited; finance actions require dedicated role + MFA.

---

## 11. Secrets and configuration

- Secrets live in a managed secrets store; injected at runtime. Never in code, images, client bundles, logs, CI output or issue trackers.
- Separate secrets per environment; no production secrets in local/preview/staging.
- **Rotate** on schedule and immediately on suspected exposure; if a secret is committed, treat it as compromised: revoke and rotate first, then clean history.
- Validate configuration at startup; fail fast and safely (never fall back to insecure defaults).
- Public/client environment variables (e.g. `NEXT_PUBLIC_*`) contain **no secrets**.
- Add secret scanning to pre-commit and CI.

---

## 12. Transport, headers and platform hardening

- **HTTPS everywhere**, HSTS, modern TLS; redirect HTTP; secure cookies.
- Security headers: `Content-Security-Policy` (strict, no `unsafe-inline` where feasible), `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, frame protection (`frame-ancestors`/`X-Frame-Options`).
- **CORS:** explicit allow-list; no wildcard with credentials.
- Rate limiting and bot protection on: auth, OTP, password reset, search, messaging, request creation, reporting, uploads.
- Encrypt data at rest (database, backups, object storage); encrypt backups and test restores; restrict backup access.
- Network segmentation and least-privilege service accounts; no public database endpoints; private networking between services.
- Keep OS, runtime and dependencies patched.

---

## 13. Dependencies and supply chain

- Prefer few, well-maintained dependencies; justify new packages (purpose, maintenance, licence, security history, size).
- Commit lockfiles; pin versions; review diffs of updates.
- Run automated dependency and vulnerability scanning (SCA) and secret scanning in CI; fix high/critical issues promptly.
- Don't add third-party scripts, SDKs, trackers or analytics without approval (they can exfiltrate data and break CSP).
- Load third-party scripts with Subresource Integrity where applicable and an allow-listed CSP.
- Beware typosquatting and install scripts; verify package names and publishers.
- CI/CD: least-privilege tokens, protected branches, required reviews, signed builds where possible; no secrets in build logs.

---

## 14. Logging, monitoring and audit

- **Structured logs** with request IDs and opaque identifiers. Redact by default.
- **Never log:** passwords, OTPs, tokens, ID numbers/images, document contents, full phone/email, payment data, message bodies.
- **Audit log** (append-only, tamper-evident) for: admin and reviewer actions, verification decisions, impersonation, suspensions, permission changes, access to Restricted data, data exports/deletions, payout changes.
- Alert on: spikes in failed logins/OTPs, unusual reviewer or admin activity, mass data access, webhook signature failures, anomalous payment activity.
- Error monitoring and analytics must scrub PII before sending.
- Protect and retain logs per policy; restrict access.

---

## 15. Abuse, fraud and safety

- Threats to plan for: fake specialists, stolen/forged IDs, fake reviews, scam briefs, advance-fee fraud, off-platform payment scams, phishing via messages, account takeover, scraping of specialist data, SMS pumping.
- Controls: verification tiers, duplicate detection, velocity limits, device/behaviour signals, report-and-block flows, trust-and-safety queues with SLAs, suspension and appeal processes.
- **Anti-scraping:** rate limit and bot-detect public profile and search endpoints; don't expose bulk-enumerable IDs or contact data; paginate with caps.
- Warn users about common scams in-product (e.g. never pay outside the platform once payments exist).
- Safe handling of sensitive reports (harassment, threats): restricted access and clear escalation paths.

---

## 16. Environments and test data

- Production data **never** leaves production. No copying prod databases to local, preview or staging.
- Use **synthetic, clearly fake** data (Nigerian-context names, cities, diacritics) for all non-production use. No real IDs, phone numbers, emails, photos or documents.
- Use **fakes/sandboxes** for KYC, payments and messaging providers; tests never call live services.
- Preview/staging environments are access-controlled and not indexed by search engines.
- Seed scripts must refuse to run against production.

---

## 17. Secure development practices

- Threat-model new features that touch identity, money, messaging, matching exposure or admin tools (what can go wrong, who could abuse it, what is the blast radius).
- Security tests for: authorisation (including IDOR), visibility invariants, contact masking, document access, rate limits, input validation, state-machine invalid transitions, webhook signature and replay handling.
- Code review checks for the items in section 19.
- Run SAST, dependency, secret and (where practical) DAST/penetration tests before launch and after major changes.
- Fail closed: on errors in auth, consent or verification checks, deny access.

---

## 18. Incident response (agent expectations)

If you discover a secret in the repo, exposed PII, a bypassable check, or a trust-integrity flaw:

1. **Stop** and do not propagate it (don't paste it into logs, PRs, issues or chat).
2. **Report it immediately** to the human owner with minimal detail and the location.
3. Recommend containment: rotate/revoke, disable the affected path, preserve evidence.
4. Don't "quietly fix" security issues without disclosure; record the fix and follow-up in the PR/ADR.

---

## 19. Security review checklist (before finishing any change)

- [ ] No secrets, real personal data or tokens committed
- [ ] New data fields classified; Restricted/Confidential data minimised, encrypted and access-controlled
- [ ] Input validated at the boundary; output encoded; no injection paths
- [ ] Authentication and per-resource authorisation enforced server-side (no IDOR)
- [ ] Visibility invariants hold: only approved, currently verified specialists are discoverable/matchable; contact details masked until permitted
- [ ] No sensitive data in logs, analytics, search indexes, error reports or client bundles
- [ ] File uploads validated, scanned, stored privately, served safely
- [ ] Rate limits and abuse controls on new endpoints
- [ ] Webhooks verified and idempotent; provider calls have timeouts/retries; fakes used in tests
- [ ] Consent, retention and data-subject-rights impact considered
- [ ] Audit logging added for sensitive actions
- [ ] No new third-party script/SDK/tracker without approval
- [ ] Negative-path tests added (unauthorised, unapproved, expired, masked)
- [ ] Verification/badge/review claims are real and explainable

---

## 20. Open security and compliance items

- [ ] Select KYC provider(s) and define the data they return/retain
- [ ] Define retention periods per data class (ID documents, messages, logs, backups)
- [ ] Appoint DPO/compliance owner; complete records of processing
- [ ] Legal review of consent flows, privacy policy, terms and cross-border transfers
- [ ] Payments/escrow regulatory and partner structure (P2)
- [ ] Policy and enforcement approach for off-platform contact before payments exist
- [ ] Incident response and breach-notification runbook
- [ ] Penetration test and threat-model schedule
- [ ] Anti-fraud tooling for OTP/SMS abuse, fake profiles and review manipulation
- [ ] Secret management, CI scanning and branch protection set up

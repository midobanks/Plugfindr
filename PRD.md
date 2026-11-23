# Plugfindr — Product Requirements Document

**Tagline:** We know someone.
**Category:** Professional talent discovery and specialist-matching platform
**Market focus:** Nigeria-first, built to scale
**Status:** Draft v0.1
**Source:** Plugfindr brand positioning and messaging document

---

## 1. Overview

### 1.1 Summary

Plugfindr helps businesses discover, connect with and engage trusted independent specialists. Businesses describe who they need, and Plugfindr returns a short, credible list of vetted specialists, then helps both sides move from introduction to working relationship.

### 1.2 Problem

Businesses don't struggle to find people who _offer_ services. They struggle to find the right people they can _trust to deliver_. Today they rely on:

- Hours of searching across social platforms and directories
- Personal referrals (slow, limited to their network)
- Open marketplaces with inconsistent quality and weak accountability

Independent specialists have the opposite problem: the skills exist, but finding quality business opportunities consistently is difficult.

### 1.3 Product promise

> The right specialist, without the endless search.

### 1.4 Strategic decision

**Businesses are the demand-side customer. Independent specialists are the supply-side network.** Product, pricing and prioritization decisions optimize for business outcomes first; the specialist experience is designed to keep supply high-quality, active and motivated.

### 1.5 Brand-to-product principles

| Brand pillar | Product implication                                                                 |
| ------------ | ----------------------------------------------------------------------------------- |
| Discovery    | Search and browse are fast, forgiving and useful with minimal input                 |
| Relevance    | Matching beats raw listing; fewer, better results                                   |
| Trust        | Verification, evidence and reviews are visible at the point of decision             |
| Speed        | Time from request to first introduction is a core metric                            |
| Connection   | The product doesn't stop at a profile view; it facilitates the working relationship |

Voice in UI copy: conversational, confident, Nigerian-inspired but globally understandable, never unnecessarily corporate (e.g. "Tell us who you need", "Meet your next specialist", "Find your plug").

---

## 2. Goals and non-goals

### 2.1 Goals

1. Let a business go from need to a shortlist of relevant, trusted specialists in minutes, not days.
2. Build a verified, quality-controlled specialist network across priority categories.
3. Convert introductions into engagements, with clear signals of success.
4. Establish trust as the core differentiator versus open marketplaces.
5. Create a foundation that can expand beyond Nigeria (multi-currency, multi-region, localization).

### 2.2 Non-goals (v1)

- Full-time recruitment or applicant tracking.
- Open bidding / race-to-the-bottom job boards.
- Being a general freelancer marketplace with unvetted mass supply.
- Complex project management, time tracking or invoicing suites (light-touch only; integrate later).
- Mobile native apps at launch (responsive web first; PWA-capable).

---

## 3. Users and personas

### 3.1 Demand side: Businesses

| Segment                                | Example                    | Need                                                         |
| -------------------------------------- | -------------------------- | ------------------------------------------------------------ |
| Startups and founders                  | Seed-stage fintech founder | Fast access to designers/developers without a hiring process |
| SMEs and growing businesses            | Logistics company          | Reliable specialists for one-off or recurring work           |
| Corporate teams                        | Marketing department       | Vetted vendors for project overflow                          |
| Agencies and consulting firms          | Creative agency            | Extra capacity and niche expertise                           |
| Entrepreneurs with project-based needs | Restaurant owner           | Branding, finance, operations help                           |

**Core problem:** "I need someone good, but I don't know where to start looking."

**Primary persona: Tola, Startup Founder.** Time-poor, has a budget range but unclear scope, worried about being burned by a bad hire, relies on WhatsApp and referrals today.

### 3.2 Supply side: Independent specialists

Product designers, software developers, marketing specialists, business consultants, financial professionals, creative professionals, operations specialists.

**Core problem:** "I have the skills, but finding quality business opportunities consistently is difficult."

**Primary persona: Chidi, Freelance Product Designer.** Strong portfolio, inconsistent pipeline, tired of underpriced marketplace gigs, wants credible clients and clear briefs.

### 3.3 Internal users

- **Trust and Safety / Verification reviewers** (review identity, credentials, portfolios)
- **Matching/Concierge team** (human-assisted matches in early phases)
- **Support and Operations**
- **Admin** (configuration, categories, moderation, reporting)

---

## 4. Scope and release phasing

| Phase             | Theme                  | Highlights                                                                                                                                                                                        |
| ----------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **MVP (Phase 1)** | "Tell us who you need" | Business and specialist accounts, specialist profiles, verification v1, search + request-a-match with human-assisted matching, introductions, in-platform messaging, basic reviews, admin tooling |
| **Phase 2**       | "Make it work"         | Automated matching, proposals/quotes, engagement agreements, escrow-style payments (NGN), ratings system expansion, saved lists, team accounts                                                    |
| **Phase 3**       | "Built for the world"  | Multi-currency, additional countries, API/integrations, advanced analytics, specialist teams/agencies, enterprise features                                                                        |

Requirements below are tagged **[P1]**, **[P2]**, **[P3]** by target phase. Priority: **Must / Should / Could**.

---

## 5. Core user journeys

### 5.1 Business: from need to engagement

1. Lands on Plugfindr, sees "Looking for someone who can get it done? Find your plug."
2. Either searches/browses categories, or submits a request ("Tell us who you need").
3. Receives a shortlist (3 to 5 matches) with match reasons and trust signals.
4. Views profiles, asks questions, requests an introduction.
5. Specialist accepts; both are connected in-platform.
6. They agree scope, timeline and price; work begins.
7. Work completes; both leave feedback; business is prompted to rebook or request a new match.

### 5.2 Specialist: from profile to opportunity

1. Signs up; builds profile (skills, portfolio, rates, availability).
2. Submits verification.
3. Gets approved and becomes discoverable.
4. Receives introduction requests and match invitations.
5. Accepts/declines, discusses scope, agrees to work.
6. Completes work and earns reviews that improve visibility.

---

## 6. Functional requirements

### 6.1 Accounts and onboarding

**Businesses**

- **BIZ-1 [P1, Must]** Sign up with email + password, Google, or phone (OTP). Phone OTP is important for Nigerian users.
- **BIZ-2 [P1, Must]** Business profile: business name, type/segment, industry, size, location, website/social links, contact person.
- **BIZ-3 [P1, Should]** Lightweight business verification (e.g. CAC number optional at P1; email domain check) to build specialist trust.
- **BIZ-4 [P2, Should]** Team accounts with roles (owner, member, viewer).
- **BIZ-5 [P1, Must]** Guest exploration: users can browse specialist categories and sample profiles before signing up; sign-up is required to request intros or send messages.

**Specialists**

- **SPC-1 [P1, Must]** Sign up via email, Google or phone.
- **SPC-2 [P1, Must]** Guided profile builder with progress indicator and completeness score.
- **SPC-3 [P1, Must]** Application-style onboarding: submitted profiles enter "pending review" before being publicly discoverable.
- **SPC-4 [P1, Should]** Import from LinkedIn, GitHub, Behance, Dribbble or portfolio URL (link-based at P1, parsed import later).

### 6.2 Specialist profiles

- **PRF-1 [P1, Must]** Profile fields:
  - Name, photo, headline (e.g. "Product designer for fintech and marketplaces")
  - Primary category and sub-skills (controlled taxonomy + tags)
  - Bio (concise, character-limited)
  - Years of experience, industries served
  - Location, time zone, languages, remote/on-site/hybrid preference
  - Engagement types (project, retainer, part-time, advisory)
  - Rate information (hourly, daily, project-from) with currency; option to show "from" ranges or "on request"
  - Availability status (available now / limited / booked) with optional date
- **PRF-2 [P1, Must]** Portfolio: up to N case studies with title, description, role, outcome, media/links, client (optional/anonymized).
- **PRF-3 [P1, Must]** Credentials: certifications, education, employment history (optional, verifiable).
- **PRF-4 [P1, Must]** Trust section on profile: verification badges, reviews, response rate and time, completed engagements on Plugfindr.
- **PRF-5 [P1, Should]** Referrals/testimonials from past clients (can be invited via link, which also supports verification).
- **PRF-6 [P2, Could]** Short intro video.
- **PRF-7 [P1, Must]** Profile visibility controls (hide contact details until introduction accepted; hide current employer if needed).
- **PRF-8 [P1, Must]** Shareable public profile URL (SEO-friendly) so specialists can bring their own clients and promote the profile.

### 6.3 Discovery

Goal: "Meet your next specialist." Discovery must work for both people who know what they want and those who don't.

- **DIS-1 [P1, Must]** Category browse (Design, Software, Marketing, Consulting, Finance, Creative, Operations) with sub-categories.
- **DIS-2 [P1, Must]** Keyword search with typo tolerance and synonyms (e.g. "UI/UX" = "product designer"; "bookkeeper" ~ "accountant").
- **DIS-3 [P1, Must]** Filters: category, skills, location/remote, availability, rate range, verification level, rating, languages, industry experience, engagement type.
- **DIS-4 [P1, Must]** Sort: best match, recently active, rating, rate, availability.
- **DIS-5 [P1, Must]** Search results cards show: photo, headline, top skills, location, rate "from", verification badges, rating, availability, response time.
- **DIS-6 [P1, Should]** Natural-language search ("I need someone to build a Paystack integration for my e-commerce store") that maps to structured filters.
- **DIS-7 [P1, Should]** Saved searches and shortlists ("Save to list"), shareable with teammates (full team features P2).
- **DIS-8 [P2, Should]** "Similar specialists" and "Hire again" recommendations.
- **DIS-9 [P1, Must]** Ranking is not pay-to-win; visibility depends on relevance, verification, quality signals and activity.
- **DIS-10 [P1, Must]** Empty and low-result states offer to switch to request-a-match: "Can't find them? Tell us who you need."

### 6.4 Request a match ("Tell us who you need")

- **REQ-1 [P1, Must]** Guided request form, designed to complete in under 3 minutes:
  - What do you need done? (free text + category)
  - Scope type (one-off project, ongoing, advisory, not sure)
  - Timeline / start date
  - Budget range (or "not sure, advise me")
  - Location / remote preference
  - Must-have skills and nice-to-haves
  - Attachments/links (briefs, references)
- **REQ-2 [P1, Should]** AI-assisted brief refinement: suggests clarifying questions and converts vague needs ("I need someone for my app") into a structured brief the business can approve.
- **REQ-3 [P1, Must]** Requests are saved, editable and have a status (submitted, matching, matches ready, in conversation, hired, closed).
- **REQ-4 [P1, Must]** Business receives a confirmation and an SLA expectation ("You'll hear from us within X hours").

### 6.5 Matching

Matching converts a business need into a curated shortlist. Quality and trust matter more than volume.

**Matching approach**

- **P1:** Human-assisted. An internal matcher uses tooling (search, filters, scoring suggestions) to produce 3 to 5 matches per request, reviewed before delivery. Rationale: validates demand, builds data and protects quality while the specialist pool is small.
- **P2:** Algorithmic matching with human review for complex or high-value requests.
- **P3:** Largely automated with continuous learning from outcomes.

**Requirements**

- **MAT-1 [P1, Must]** Matching tool for internal team: request details alongside ranked candidate suggestions with scoring breakdown.
- **MAT-2 [P2, Must]** Scoring model using: skill overlap, category fit, industry experience, availability, budget compatibility, location/time zone, verification level, past performance, response behavior, and business-specific preferences.
- **MAT-3 [P1, Must]** Every match shows **"Why this match"** (2 to 3 plain-language reasons, e.g. "Built 3 fintech apps; available from March; verified").
- **MAT-4 [P1, Must]** Specialist opt-in: specialists are asked whether they're interested and available before being presented as a final match (prevents dead-end intros).
- **MAT-5 [P1, Should]** Business can give feedback on a match (relevant / not relevant + reason), which feeds tuning.
- **MAT-6 [P1, Must]** Business can request more or different matches without restarting.
- **MAT-7 [P2, Should]** Fairness/exposure controls so new verified specialists get a chance to be matched and a few top profiles do not absorb all demand.
- **MAT-8 [P1, Must]** Conflict handling: no matching of a specialist to businesses they've flagged or blocked; respect exclusivity or conflict-of-interest declarations.
- **MAT-9 [P1, Must]** Target match turnaround: within 24 hours at launch, trending toward minutes with automation.

### 6.6 Verification and trust

Trust is the differentiator. Verification is tiered and visible, so businesses see _what_ has been verified, not just a generic checkmark.

**Verification tiers**

| Badge                               | What it confirms                                                                                     | Phase            |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------- | ---------------- |
| **Identity Verified**               | Government ID and liveness check (e.g. NIN/BVN/passport/driver's licence via a verification partner) | P1               |
| **Contact Verified**                | Email and phone confirmed                                                                            | P1               |
| **Portfolio Reviewed**              | Work samples reviewed by Plugfindr for authenticity and quality                                      | P1               |
| **Credentials Checked**             | Certifications/education validated where possible                                                    | P1/P2            |
| **Experience Referenced**           | Reference contacts or past clients confirmed                                                         | P1 (manual) / P2 |
| **Skill Assessed**                  | Skills test or structured interview in selected categories                                           | P2               |
| **Plugfindr Proven**                | Completed engagements on-platform with strong ratings                                                | P2               |
| **Business Verified** (demand side) | Business registration/domain confirmed                                                               | P1/P2            |

**Requirements**

- **VER-1 [P1, Must]** Verification workflow with statuses (not started, submitted, in review, approved, rejected, needs more info, expired).
- **VER-2 [P1, Must]** Reviewer admin console: queue, document viewer, checklists, notes, approve/reject with reason, audit log.
- **VER-3 [P1, Must]** Integration with at least one identity verification provider for Nigerian ID checks (provider to be selected; candidates include local KYC vendors).
- **VER-4 [P1, Must]** Only approved specialists are discoverable and matchable. Unverified profiles remain private.
- **VER-5 [P1, Must]** Badges are clickable and explain exactly what was checked and when.
- **VER-6 [P1, Should]** Verification expiry and re-verification reminders (e.g. 12 months).
- **VER-7 [P1, Must]** Sensitive documents stored encrypted with strict access control; ID documents never shown to businesses.
- **VER-8 [P1, Must]** Misrepresentation policy: confirmed false claims lead to badge removal or suspension.
- **VER-9 [P1, Must]** Reporting: businesses and specialists can report a profile, message or behavior; reports go to a Trust and Safety queue with SLA.
- **VER-10 [P2, Should]** Review authenticity: only parties to a completed engagement can leave a verified review.
- **VER-11 [P1, Must]** Compliance with Nigerian data protection requirements (NDPA 2023 / NDPR) for collecting and processing identity data; consent capture and retention policy.

### 6.7 Engagement (introduction to completed work)

**Introductions**

- **ENG-1 [P1, Must]** Business can "Request an introduction" from a profile or match. Specialist receives a summary (brief, budget, timeline) and can accept, decline (with reason) or ask questions.
- **ENG-2 [P1, Must]** Specialist response SLA indicator (e.g. respond within 48 hours); non-responses are tracked and affect ranking.
- **ENG-3 [P1, Must]** On acceptance, a conversation thread opens.

**Messaging**

- **ENG-4 [P1, Must]** In-platform messaging with file attachments, notifications and read receipts.
- **ENG-5 [P1, Must]** Contact details (phone, email, WhatsApp) are masked until the specialist chooses to share them or an engagement is confirmed. Policy and enforcement approach for off-platform leakage to be defined (see Open Questions).
- **ENG-6 [P1, Should]** WhatsApp notification channel (message alerts with deep links), because it is the dominant channel in the target market.
- **ENG-7 [P1, Should]** Optional intro call scheduling (links to calendar tools).

**Proposals and agreements (Phase 2)**

- **ENG-8 [P2, Must]** Specialist can send a proposal: scope, deliverables, timeline, price, milestones.
- **ENG-9 [P2, Must]** Business can accept, counter or decline; accepted proposals become an engagement record.
- **ENG-10 [P2, Should]** Lightweight standard agreement template (scope, IP ownership, payment terms, confidentiality), localized for Nigerian contracting norms; legal review required.

**Payments (Phase 2)**

- **ENG-11 [P2, Should]** Payments in NGN via a local payment processor (e.g. Paystack, Flutterwave); milestone-based funding held until approval (escrow-style, subject to regulatory review).
- **ENG-12 [P2, Should]** Invoicing and receipts; support for withholding tax handling where applicable.
- **ENG-13 [P3, Could]** Multi-currency and cross-border payouts.

**Tracking and completion**

- **ENG-14 [P1, Should]** Engagement status tracking: Introduced, In discussion, Hired, In progress, Completed, Not proceeding. At P1 this can be self-reported by both parties through prompts.
- **ENG-15 [P1, Must]** Post-engagement prompts for both parties: outcome, rating and review.
- **ENG-16 [P1, Must]** Reviews: rating (1 to 5) across dimensions (quality, communication, reliability, value), written comment, optional private feedback to Plugfindr.
- **ENG-17 [P2, Should]** Specialist can respond publicly to reviews.
- **ENG-18 [P2, Could]** "Hire again" shortcut and recurring engagement support.
- **ENG-19 [P2, Should]** Dispute process: structured intake, evidence submission, Plugfindr mediation.

### 6.8 Specialist-side opportunity features

- **SUP-1 [P1, Must]** Specialist dashboard: profile views, introduction requests, match invitations, response rate, verification status.
- **SUP-2 [P1, Must]** Opportunity inbox with clear briefs and one-tap accept/decline.
- **SUP-3 [P1, Should]** Profile improvement tips ("Add 2 more case studies to appear in more matches").
- **SUP-4 [P1, Must]** Availability controls (pause matches; set capacity).
- **SUP-5 [P2, Could]** Earnings and engagement history.
- **SUP-6 [P2, Could]** Shareable "Verified on Plugfindr" badge/embed for the specialist's own site.

### 6.9 Notifications and communications

- **NOT-1 [P1, Must]** Channels: email, in-app, push (web), and WhatsApp/SMS where permitted.
- **NOT-2 [P1, Must]** Event notifications: match ready, introduction request, message received, verification update, engagement prompts, review requests.
- **NOT-3 [P1, Must]** User-level notification preferences and unsubscribe; compliance with consent rules.

### 6.10 Admin and operations

- **ADM-1 [P1, Must]** User management (view, suspend, reinstate, impersonate with audit for support).
- **ADM-2 [P1, Must]** Verification and moderation queues (see 6.6).
- **ADM-3 [P1, Must]** Matching workbench (see 6.5).
- **ADM-4 [P1, Must]** Taxonomy management (categories, skills, synonyms).
- **ADM-5 [P1, Should]** Content and review moderation.
- **ADM-6 [P1, Must]** Reporting dashboards: funnel, supply/demand balance, match performance, verification throughput.
- **ADM-7 [P1, Must]** Role-based access control and full audit logging.
- **ADM-8 [P1, Should]** Feature flags and configurable thresholds (e.g. number of matches delivered, SLA timers).

---

## 7. Monetization (to validate)

The business is the paying customer. Candidate models, to be tested:

1. **Success fee / commission** on completed engagements (clear fit once payments are in-platform, Phase 2).
2. **Match fee** per successfully introduced engagement (usable at P1 before payments exist).
3. **Subscription** for businesses with frequent needs (access to concierge matching, priority, team accounts).
4. **Specialist premium** (profile tools, analytics) with strict rules so it never buys trust badges or distorts ranking.

**Principles:** specialists are not charged to be listed or verified in a way that creates pay-to-play; businesses pay for outcomes and convenience.

---

## 8. Non-functional requirements

| Area                        | Requirement                                                                                                                                                                      |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Performance**             | Search results within 1.5s (p95); pages load under 3s on a 3G/4G connection typical in the market                                                                                |
| **Mobile and connectivity** | Mobile-first responsive design; lightweight pages; resilient to intermittent connectivity; image compression                                                                     |
| **Availability**            | 99.5% at launch, targeting 99.9%                                                                                                                                                 |
| **Security**                | Encryption in transit and at rest; MFA for admin and reviewer roles; least-privilege access; regular security testing                                                            |
| **Privacy and compliance**  | NDPA/NDPR compliance; explicit consent for identity data; data subject rights (access, correction, deletion); data retention policy; plan for GDPR alignment as expansion begins |
| **Accessibility**           | WCAG 2.1 AA target                                                                                                                                                               |
| **Localization**            | English at launch with Nigerian English tone; architecture supports additional languages (e.g. Yoruba, Igbo, Hausa, Pidgin, French) and currencies                               |
| **Scalability**             | Architecture supports tens of thousands of specialists and concurrent searches without redesign                                                                                  |
| **Observability**           | Event tracking, error monitoring, audit logs, alerting                                                                                                                           |
| **Abuse and fraud**         | Rate limiting, spam detection in messaging, duplicate/fake profile detection, suspicious activity review                                                                         |

---

## 9. Data model (high level)

- **User** (role: business, specialist, admin)
- **BusinessProfile**, **TeamMember**
- **SpecialistProfile**, **Skill**, **Category**, **PortfolioItem**, **Credential**
- **Verification** (type, status, evidence refs, reviewer, timestamps, expiry)
- **Request** (brief, scope, budget, timeline, status)
- **Match** (request, specialist, score, reasons, status, business feedback)
- **Introduction** (business, specialist, status, response time)
- **Conversation**, **Message**
- **Engagement** (status, scope, price, milestones)
- **Proposal** (P2), **Payment/Transaction** (P2)
- **Review** (ratings, text, verified flag)
- **Report** (reporter, subject, reason, status)
- **Notification**, **AuditLog**

---

## 10. Success metrics

### 10.1 North star

**Number of successful engagements started per month** (introductions that result in a confirmed working relationship).

### 10.2 Demand-side metrics

- Request completion rate (started to submitted)
- Time from request to first shortlist
- Match relevance rating (% rated relevant)
- Introduction request rate per shortlist
- Intro-to-engagement conversion rate
- Repeat usage (30/90-day return and rehire rate)
- Business NPS

### 10.3 Supply-side metrics

- Specialist application to approval rate and time to verify
- Profile completeness
- Introduction response rate and time
- Acceptance rate of match invitations
- Specialist activation (received and responded to at least one opportunity within 30 days)
- Specialist NPS

### 10.4 Trust and quality

- Verified specialist share of discoverable supply
- Review submission rate and average rating
- Report rate and resolution time
- Dispute rate per engagement
- Fraud or misrepresentation incidents

### 10.5 Marketplace health

- Supply-to-demand ratio by category
- Liquidity: % of requests receiving at least 3 viable matches within 24h
- Concentration: share of introductions going to top 10% of specialists

### 10.6 Initial targets (to calibrate with real data)

- 80% of requests receive a shortlist within 24 hours
- 60% of shortlists lead to at least one introduction request
- 25% of introductions convert to engagements
- 70% specialist response rate within 48 hours

---

## 11. Go-to-market considerations (product-relevant)

- **Supply first, with quality:** seed 200 to 500 verified specialists in 3 to 4 priority categories (suggested: product design, software development, marketing, business/finance consulting) before opening broad demand.
- **Concierge launch:** founders and ops handle matching manually to learn what "good" looks like.
- **Community channels:** WhatsApp communities, LinkedIn and X (Twitter), startup ecosystems, creative communities, referrals from existing networks.
- **Referral loops:** businesses and specialists can invite others; "We know someone" referral prompts after successful engagements.
- **SEO:** public specialist profiles and category pages (e.g. "Product designers in Lagos").

---

## 12. Risks and mitigations

| Risk                                                                                  | Impact                   | Mitigation                                                                                                                      |
| ------------------------------------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Chicken-and-egg liquidity                                                             | Poor matches, churn      | Concierge matching; focus on few categories; seed supply deliberately                                                           |
| Off-platform leakage (disintermediation)                                              | Lost revenue and data    | Provide value beyond intro (verification, payments protection, reputation); contact masking; incentives for staying on-platform |
| Verification cost and friction                                                        | Slower supply growth     | Tiered verification; partner for ID checks; prioritize high-impact checks                                                       |
| Fake profiles / fraud                                                                 | Loss of trust            | Multi-layer checks, reporting, review authenticity, monitoring                                                                  |
| Payments and regulatory complexity (escrow)                                           | Delayed Phase 2          | Use licensed partners; get legal advice early                                                                                   |
| Data protection non-compliance                                                        | Fines, reputational harm | Privacy by design, DPO/compliance owner, consent flows                                                                          |
| Quality inconsistency                                                                 | Brand damage             | Review gating, performance-based visibility, offboarding standards                                                              |
| Connectivity and device constraints                                                   | Reduced adoption         | Lightweight mobile-first build, WhatsApp channel                                                                                |
| Brand overreach ("Built in Africa, ready for the world") before foundations are ready | Distraction              | Phase 3 for expansion; architecture prepared now                                                                                |

---

## 13. Dependencies

- Identity verification provider(s) for Nigerian IDs
- Payment processor and potentially escrow/licensed partner (Phase 2)
- Messaging/notification providers (email, SMS, WhatsApp Business API)
- Search infrastructure (supporting typo tolerance, filters and relevance tuning)
- Legal review: terms of service, specialist agreement, privacy policy, standard engagement agreement
- Design system aligned to brand (tone of voice, "plug" language)

---

## 14. Open questions

1. Which categories launch first, and what is the minimum supply per category before opening to businesses?
2. Do specialists see businesses' budgets up front, or only after accepting an introduction?
3. How strictly will off-platform contact be restricted at P1, before payments exist?
4. What is the first monetization model to test (match fee vs. commission vs. subscription)?
5. How are rates displayed (public ranges vs. on request), and do we guard against low-ball pressure?
6. What is the verification bar for "Portfolio Reviewed", and who owns the standards (internal reviewers vs. expert panel)?
7. Do we support specialist agencies/teams at launch, or individuals only?
8. What are the legal requirements for escrow-style holding of funds in Nigeria, and which partner structure is best?
9. How will we handle specialists outside Nigeria (diaspora) from the start, and does that affect Nigeria-first positioning?
10. What is the policy on AI-generated portfolios or profile content?

---

## 15. Appendix: Copy and messaging reference

| Purpose            | Message                                                |
| ------------------ | ------------------------------------------------------ |
| Master tagline     | We know someone                                        |
| Campaign tagline   | Find the right plug                                    |
| Product promise    | The right specialist, without the endless search       |
| Business message   | Whatever you need done, find someone who can do it     |
| Specialist message | Put your expertise in front of businesses that need it |
| Brand belief       | Great talent deserves to be found                      |

**UI copy examples**

- Request form CTA: "Tell us who you need"
- Browse heading: "Meet your next specialist"
- Home hero: "Looking for someone who can get it done? Find your plug."
- Empty state: "No plug for that yet? Tell us who you need and we'll find them."
- Verification explainer: "We check, so you don't have to."

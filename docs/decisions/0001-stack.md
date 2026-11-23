# ADR 0001 — Application stack

- Status: Accepted
- Date: 2026-11-22

## Context

Plugfindr had only product and brand documentation. The team needed a single stack for a
Nigeria-first, trust-led web app that starts with a public site and grows into business and
specialist applications plus internal admin tooling. Low-bandwidth mobile performance and a
framework-free domain layer are hard requirements.

## Decision

Use TypeScript, React and Next.js App Router on Vercel, with Node.js route handlers under
`/v1` for the API. PostgreSQL with Prisma is the system of record. Styling uses CSS design
tokens from `packages/ui` and no utility CSS framework. The repository is an npm-workspaces
monorepo with `apps/web`, `apps/admin` and `packages/{domain,database,ui,config,adapters}`.

External providers for KYC, payments, messaging, search and storage are not selected. Each
sits behind a port in `packages/adapters` with an in-memory fake for local work and tests.

## Alternatives

- Standalone Node framework with a separate frontend: more deployment surface, no benefit for
  the server-rendered public pages needed for SEO.
- Pages Router: App Router gives server components by default and is the current Next.js default.
- Utility CSS framework: conflicts with the brand's token-based design system and adds bundle cost.
- Prisma 8 release candidate: chose the stable 6.x line to avoid RC tooling risk.

## Consequences

- Public pages render on the server and ship minimal client JavaScript.
- Domain code has no framework, ORM or HTTP imports; state machines are pure and unit-tested.
- Serverless database connections need a pooling strategy before production.
- Asynchronous jobs need a queue; Vercel Cron covers schedules only.
- Provider selection, CI setup, migration execution on Vercel and an E2E runner remain open.

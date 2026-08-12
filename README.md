# EvalCanvas M&E

EvalCanvas turns NGO programme intent and grant obligations into a traceable Monitoring & Evaluation workflow:

`Funder → Grant → Programme → Taxonomy → Framework requirement → Indicator → Data point → Submission/Observation → Actual → Alert/Report`

## Run locally

```bash
npm install
cp .env.example .env
npm run db:generate
npx prisma migrate deploy
npm run db:demo
npm run dev
```

Open <http://localhost:3000> and sign in with:

- Email: `asha@demo.evalcanvas.org`
- Password: `EvalCanvas!2026`

`npm run db:demo` is additive and idempotent. It adds the girls’ education presentation story and archives malformed legacy title-test drafts without deleting them. Do not use `db:reset` before the presentation.

## Verification

```bash
npm run lint
npm run typecheck
npm run build
npm audit --omit=dev
```

The application uses Next.js 16 App Router, React 19, Prisma 6.19.3, SQLite, Zod, Groq’s server-side chat-completions API, Recharts, Tailwind CSS, `pdf-parse`, `mammoth`, and `jszip`.

## Environment

```env
DATABASE_URL="file:./dev.db"
SESSION_SECRET="replace-with-a-long-random-secret"
GROQ_API_KEY=
GROQ_MODEL="openai/gpt-oss-120b"
```

The Groq key is server-only. With no key, programme intake remains usable through a labelled deterministic generator; no AI success is claimed. `.env*` is ignored while `.env.example` is committed explicitly.

## Product status

Working live: authenticated routes; three programme intake methods; title safeguards; editable programme review; funder/grant creation; taxonomy correction; indicator review and expandable data points; UniCollector; CSV preview/mapping/import; Unisheets; count/sum/average/percentage calculations; KPI-driven alerts; Impact Overview; BRSR/CSR-2/standard report generation; browser print/PDF.

Clearly deferred: Google Sheets sync, custom connectors, custom taxonomy-node authoring, persistent form drafts, invitation delivery, password change, notification-preference editing, historical KPI snapshots, and production-grade multi-tenant authorization.

See [Demo Guide](docs/DEMO_GUIDE.md), [Architecture](docs/ARCHITECTURE.md), and [Current-State Audit](docs/CURRENT_STATE_AUDIT.md).

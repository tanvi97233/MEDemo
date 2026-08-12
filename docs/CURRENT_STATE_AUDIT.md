# Current-state audit and implementation record

## Baseline

- Framework: Next.js 16.3 App Router, React 19, TypeScript, Tailwind CSS 4.
- Persistence: Prisma 6 with SQLite at `prisma/dev.db`.
- Mutations: authenticated server actions in `src/app/actions.ts`; API routes for taxonomy/document analysis and CSV export.
- Authentication: bcrypt credentials, database sessions, signed HTTP-only cookie, and Next.js 16 `proxy.ts` route gating.
- AI: centralized server-only Groq integration with JSON response mode and Zod validation; deterministic labelled fallback.
- Seed data: relational programmes, funders, grants, frameworks, indicators, fields, submissions, observations, alerts and reports.
- Baseline checks on 13 August 2026: lint passed, TypeScript passed, production build passed.

The relevant Next.js 16 server-action, form and proxy guides in `node_modules/next/dist/docs/01-app/` were read before implementation.

## Before implementation

| Area | Baseline state | Finding |
|---|---|---|
| Impact Overview | Partially working | KPI/target data was live, but beneficiary, submission, reports-due and several chart values were hardcoded. |
| Programme narrative | Broken title logic | Raw first sentence was saved as the programme name; the saved review was read-only. |
| Document intake | UI/metadata only | PDF/PPTX/DOCX content was not extracted and classification used the filename. |
| Structured intake | Partially working | Persisted normalized records and custom fields, but shared editing was absent. |
| Add Funder | UI only | Button had no handler. |
| Grant amount | Partial | Programme grant used numeric coercion; no working standalone grant form or formatted-input validation. |
| Taxonomy | Disconnected | Explorer showed the full static graph rather than programme-linked persisted nodes. |
| Indicators | Partially working | Approval/editing existed; table rows did not expose data points. |
| UniCollector | Partially working | Persisted observations, but showed every programme field rather than an indicator-specific form. |
| CSV Import | UI only | Preview ended in an alert explicitly saying no data was written. |
| Calculations | Partial | Count and percentage only; alert resolution and other simple strategies were absent. |
| Reports | Partial | Action worked, but comparison/framework controls were not submitted and reach text invented 1,286 contacts. |
| Alerts | Partially working | Seeded real-condition examples plus below-target creation; incomplete status transitions. |
| Settings | Misleading UI | Editable-looking controls did not persist. |
| Navigation | Partial | Data was a single link; global selector options were hardcoded; alert icon showed only a dot. |

## Implemented

- Additive migrations for programme review fields, calculation type, complete data-point metadata, report configuration, and idempotency keys.
- Exact title safeguard verified for `Generate a programme for girl child education.`
- Real text extraction for PDF, DOCX, PPTX, TXT and MD, with 10 MB validation and honest scanned/encrypted-file errors.
- Editable shared programme review plus activation; generated ToC, classifications, indicators and questions remain drafts until review.
- Working Add Funder modal that transactionally creates a separate Funder and Grant and rejects invalid/zero amounts.
- Programme/grant/framework context now feeds taxonomy and indicator generation.
- Programme-linked taxonomy browser and persisted correction.
- Keyboard-accessible expandable KPI rows with formula and complete data-point metadata.
- Separate Data Collection and Data Connectors navigation; persistent CSV import and unified Unisheets provenance.
- Count, sum, average, percentage and numerator/denominator calculation strategies; alert create/update/resolve behavior.
- Persisted-data dashboard metrics and charts; numeric open-alert badge.
- Report configuration stores reporting period, comparison period and BRSR/CSR-2/standard framework.
- Settings controls are read-only or visibly Coming soon instead of silently inert.
- Additive coherent girls’ education presentation dataset; malformed legacy title-test programmes are archived, not deleted.

## Known partial areas

- Global top-bar filters retain URL state, but not every page applies every global filter; use module filters in the live demo.
- Programme custom fields persist at creation, but existing custom fields are not edited in the shared review.
- CSV supports a demo-safe comma-separated format; quoted values containing commas are not a production CSV parser.
- Form drafts survive in the browser during the current page session, not across sign-out or device changes.
- Report comparison is honest but historical KPI snapshots are not stored; it reports record availability and does not invent trend values.
- Missing-submission and deadline alerts are represented by real seeded conditions; there is no background scheduler in this local MVP.
- One Grant links to one Programme in the current schema. Multiple funders per programme and multiple grants per funder work.

# Product logic and architecture

## End-to-end logic

1. Programme intake accepts one of three sources. Narrative and documents are normalized by Groq or the labelled deterministic fallback; the structured form enters the same fields directly.
2. Title safeguards remove instruction language, cap length, use title case and provide a subject-based fallback. All normalized fields remain editable in programme review.
3. Programme narrative plus grant requirements and framework requirements are matched to canonical taxonomy names. Persisted ProgrammeTaxonomy rows point to existing hierarchy nodes.
4. The approved results chain, taxonomy, grant, framework and requirement context generate suggested Indicators. Suggestions are reviewable, editable, rejectable and regenerable.
5. Each Indicator owns DataFields: definitions, questions, types, units, validation, frequency, disaggregation, calculation role and source.
6. UniCollector and CSV Import create Submission rows and linked Observation rows. Source provenance distinguishes `UniCollector` from `CSV Import`; both appear in Unisheets.
7. `src/lib/monitoring.ts` deterministically recalculates affected indicators using COUNT, SUM, AVERAGE, PERCENTAGE or numerator/denominator percentage logic.
8. The calculated actual is compared with target: at/above target is On Track, 75–99% is At Risk, below 75% is Off Track. Alert rules create, update or resolve persisted Alert rows.
9. Impact Overview queries the same persisted records. Reports assemble programme, grant, framework, KPI, submission, quality and risk data and state missing comparison evidence.

## AI versus deterministic logic

| Stage | AI-assisted | Deterministic |
|---|---|---|
| Programme normalization | Groq structured JSON when configured | Zod validation, fallback generator, human review |
| Title | Groq may propose | Safeguard/sanitizer and fallback always run |
| Taxonomy suggestion | Groq may rank | Exact matching to canonical nodes and user confirmation |
| ToC/KPI suggestions | Groq structured JSON | Schema validation, persisted relations, approval state |
| Document handling | No fabricated interpretation | PDF/DOCX/PPTX text extraction and validation |
| Collection/import | None | Field validation, persistence, provenance |
| Actuals/status/alerts | None | Explicit formulas and thresholds |
| Reports | None in this MVP | Stored-data assembly with insufficiency statements |

## Core files

- `prisma/schema.prisma`: relational domain model.
- `src/app/actions.ts`: authenticated mutation boundary.
- `src/lib/groq.ts`: server-only AI provider and schema validation.
- `src/lib/programme-taxonomy.ts`: canonical matching and search.
- `src/lib/monitoring.ts`: calculations and alert state changes.
- `src/components/programme-form.tsx`: three intake methods and taxonomy confirmation.
- `src/components/collector-form.tsx`: indicator-specific UniCollector.
- `src/components/csv-import.tsx`: CSV preview, mapping and confirmation.
- `src/app/data/connectors/page.tsx`: connectors and unified Unisheets.

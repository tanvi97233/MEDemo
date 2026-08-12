# 5–7 minute presentation guide

## Before presenting

Run `npx prisma migrate deploy`, `npm run db:demo`, and `npm run dev`. Do not run `db:reset`. Sign in once with the seeded admin account. Use the girls’ education programme and 2026 Q3. Keep a simple CSV fallback with headers `respondent_id,location,reporting_period,value,gender`.

## Click path

1. Sign in as Asha. Open **Impact Overview**. Point to persisted reach, active programmes/funders, grant value, KPI status, submissions, completeness, alerts and reports due. Say: “This is not a separate dashboard dataset; these cards query the operational records.” Proof: cards link to their source pages. Fallback: refresh once if the dev server is compiling.
2. In **Funder performance**, open **Shiksha Equity Foundation**. Show Overview, Grants, Frameworks, Indicators, Calendar and Reports. Say: “A funder is the organization; each grant carries its own money, programme, framework and deadline.”
3. Open **Programs → Create programme → Describe with AI**. Enter `Generate a programme for girl child education.` Click **Analyze programme**. Expect an analyzing spinner, then exact canonical taxonomy suggestions. Confirm and continue.
4. Select a funder, BRSR or CSR-2, enter a positive grant amount and requirements, then click **Structure programme draft**. Expect “Creating review draft…”; Groq can take up to 45 seconds. Without a key, the labelled deterministic result is immediate. Proof: the review title is **Girls’ Education and Empowerment Programme**, not the instruction.
5. Edit the title or another structured field and click **Save review changes**. Review taxonomy, Theory of Change and suggested indicators. Click **Approve & activate** only after review. Fallback: use the seeded Girls’ Education and Empowerment Programme if provider latency is unsuitable.
6. Open **Indicators**, filter to the programme, and expand **Girls attending at least 80% of scheduled classes** with the chevron or indicator-name button. Show formula, role, required field, validation, frequency, disaggregation, source and question. The control is keyboard accessible.
7. Open **Data → Data Collection → Start collecting data**. Select the programme, KPI and 2026 Q3; enter location and a new respondent ID; answer the KPI question; confirm consent; submit. Expect “Validating and saving…” then a redirect to Unisheets.
8. In **Data → Data Connectors → Unisheets**, locate the respondent ID. Say: “UniCollector is the form; Unisheets is the unified destination.” Proof: Source is UniCollector and the row shows its linked KPI and value.
9. Return to **Indicators** and show the changed actual/status, then **Impact Overview** and **Alerts**. Say: “The same write recalculates the KPI and evaluates early-warning rules.” Fallback: point to the verified seeded 75% At Risk attendance KPI and its alert.
10. Open **Reports → Generate report**. Select the girls’ programme, grant, 2026 Q3, Funder progress report, 2026 Q2 comparison and BRSR. Generate. Show target/actual, reach, risk, framework mapping and the honest “insufficient data” comparison statement. Use **Print / Save PDF**.
11. Open **Settings**. Explain that organization/users/frameworks are read live; unavailable invitation, password and preference mutations are explicitly disabled. Open the profile menu and **Sign out**.

## Alternate intake checks

- **Upload document:** use a text-bearing PDF, DOCX, PPTX, TXT or MD under 10 MB. The screen reports what was extracted. A scanned/image-only or unsupported DOC/PPT receives an honest error.
- **Structured form:** complete required dates/budget/text, optionally add/remove custom fields, then use the same funder step and shared review.
- **Invalid amount:** enter text or zero in Add Funder. The modal says it was not saved as zero.
- **Duplicate click:** submit buttons disable while pending; programme and submission idempotency keys also prevent repeated writes.

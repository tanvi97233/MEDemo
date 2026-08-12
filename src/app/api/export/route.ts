import { db } from "@/lib/db";
import { verifySession } from "@/lib/session";
export async function GET() {
  await verifySession();
  const rows = await db.submission.findMany({
    include: {
      programme: true,
      grant: { include: { funder: true } },
      submittedBy: true,
      observations: { include: { dataField: true } },
    },
  });
  const esc = (v: unknown) => `"${String(v ?? "").replaceAll('"', '""')}"`;
  const header = [
    "submitted_at",
    "period",
    "programme",
    "funder",
    "grant",
    "location",
    "beneficiary_id",
    "gender",
    "age_group",
    "disability",
    "values",
    "source",
    "validation",
    "submitted_by",
  ];
  const csv = [
    header.join(","),
    ...rows.map((s) =>
      [
        s.submittedAt.toISOString(),
        s.reportingPeriod,
        s.programme.name,
        s.grant?.funder.name,
        s.grant?.name,
        s.location,
        s.beneficiaryId,
        s.gender,
        s.ageGroup,
        s.disability,
        s.observations
          .map((o) => `${o.dataField.key}=${o.numericValue ?? o.textValue}`)
          .join(";"),
        s.source,
        s.validationStatus,
        s.submittedBy.name,
      ]
        .map(esc)
        .join(","),
    ),
  ].join("\n");
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": "attachment; filename=evalcanvas-unisheets.csv",
    },
  });
}

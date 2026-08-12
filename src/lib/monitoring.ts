import { db } from "./db";

export function indicatorStatus(
  actual: number,
  target: number,
  hasData = true,
) {
  if (!hasData) return "NO_DATA";
  const ratio = target === 0 ? 1 : actual / target;
  if (ratio >= 1) return "ON_TRACK";
  if (ratio >= 0.75) return "AT_RISK";
  return "OFF_TRACK";
}

export async function recalculateIndicator(indicatorId: string) {
  const indicator = await db.indicator.findUnique({
    where: { id: indicatorId },
    include: {
      observations: { include: { dataField: true } },
      dataFields: true,
    },
  });
  if (!indicator) return;
  const values = indicator.observations
    .map((o: { numericValue: number | null }) => o.numericValue)
    .filter((v): v is number => v !== null);
  if (!values.length) return;
  const numeratorValues = indicator.observations
    .filter((o: { dataField: { calculationRole?: string } }) =>
      o.dataField.calculationRole === "NUMERATOR",
    )
    .map((o: { numericValue: number | null }) => o.numericValue)
    .filter((v): v is number => v !== null);
  const denominatorValues = indicator.observations
    .filter((o: { dataField: { calculationRole?: string } }) =>
      o.dataField.calculationRole === "DENOMINATOR",
    )
    .map((o: { numericValue: number | null }) => o.numericValue)
    .filter((v): v is number => v !== null);
  let actual: number;
  if (indicator.calculationType === "SUM")
    actual = values.reduce((a: number, b: number) => a + b, 0);
  else if (indicator.calculationType === "AVERAGE")
    actual = values.reduce((a: number, b: number) => a + b, 0) / values.length;
  else if (indicator.calculationType === "PERCENTAGE") {
    actual =
      denominatorValues.length &&
      denominatorValues.reduce((a: number, b: number) => a + b, 0) > 0
        ? (numeratorValues.reduce((a: number, b: number) => a + b, 0) /
            denominatorValues.reduce((a: number, b: number) => a + b, 0)) *
          100
        : values.reduce((a: number, b: number) => a + b, 0) / values.length;
  } else
    actual = new Set(indicator.observations.map((o: { submissionId: string }) => o.submissionId)).size;
  const required = indicator.dataFields.filter(
    (field: { required?: boolean }) => field.required,
  ).length;
  const completeness = required
    ? Math.min(
        100,
        Math.round(
          (values.length /
            (required *
              new Set(
                indicator.observations.map((o: { submissionId: string }) => o.submissionId),
              ).size)) *
            100,
        ),
      )
    : 100;
  actual = Math.round(actual * 100) / 100;
  await db.indicator.update({
    where: { id: indicator.id },
    data: {
      actual,
      status: indicatorStatus(actual, indicator.target),
      completeness,
      lastUpdated: new Date(),
    },
  });
}

export async function evaluateIndicatorAlert(indicatorId: string) {
  const indicator = await db.indicator.findUnique({
    where: { id: indicatorId },
  });
  if (!indicator) return;
  if (indicator.status === "ON_TRACK") {
    await db.alert.updateMany({
      where: {
        indicatorId,
        type: { in: ["BELOW_TARGET", "INDICATOR_AT_RISK"] },
        status: { not: "RESOLVED" },
      },
      data: { status: "RESOLVED" },
    });
    return;
  }
  const type =
    indicator.status === "AT_RISK" ? "INDICATOR_AT_RISK" : "BELOW_TARGET";
  await db.alert.updateMany({
    where: {
      indicatorId,
      type: type === "INDICATOR_AT_RISK" ? "BELOW_TARGET" : "INDICATOR_AT_RISK",
      status: { not: "RESOLVED" },
    },
    data: { status: "RESOLVED" },
  });
  const existing = await db.alert.findFirst({
    where: { indicatorId, type, status: { not: "RESOLVED" } },
  });
  const reason = `${indicator.name} is ${Math.round(indicator.target - indicator.actual)} ${indicator.unit} below target.`;
  if (existing)
    await db.alert.update({ where: { id: existing.id }, data: { reason, severity: indicator.status === "OFF_TRACK" ? "HIGH" : "MEDIUM" } });
  else
    await db.alert.create({
      data: {
        programmeId: indicator.programmeId,
        grantId: indicator.grantId,
        indicatorId,
        type,
        severity: indicator.status === "OFF_TRACK" ? "HIGH" : "MEDIUM",
        reason,
        owner: indicator.responsiblePerson,
      },
    });
  if (
    indicator.completeness < 80 &&
    !(await db.alert.findFirst({
      where: {
        indicatorId,
        type: "LOW_COMPLETENESS",
        status: { not: "RESOLVED" },
      },
    }))
  )
    await db.alert.create({
      data: {
        programmeId: indicator.programmeId,
        grantId: indicator.grantId,
        indicatorId,
        type: "LOW_COMPLETENESS",
        severity: "MEDIUM",
        reason: `${indicator.name} data completeness is ${indicator.completeness}%, below the 80% rule.`,
        owner: indicator.responsiblePerson,
      },
    });
}

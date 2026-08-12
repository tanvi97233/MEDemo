import { ProgrammeForm } from "@/components/programme-form";
import { Card, PageHeader } from "@/components/ui";
import { db } from "@/lib/db";
import { taxonomySectorNames } from "@/lib/programme-taxonomy";

export default async function NewProgrammePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ error }, funders, frameworks] = await Promise.all([
    searchParams,
    db.funder.findMany(),
    db.framework.findMany(),
  ]);
  return (
    <>
      <PageHeader
        eyebrow="Programs / New"
        title="Create a programme evidence plan"
        description="Start from a narrative, a document, or structured fields. EvalCanvas creates a transparent draft for human review—never an automatic approval."
      />
      {error && (
        <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {!process.env.GROQ_API_KEY?.trim() && (
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <strong>AI provider not configured.</strong> Set GROQ_API_KEY and optionally GROQ_MODEL on the server to use Groq. The form remains usable with a clearly labelled deterministic draft generator.
        </p>
      )}
      <Card className="mx-auto max-w-5xl p-5 sm:p-7">
        <ProgrammeForm
          funders={funders}
          frameworks={frameworks}
          taxonomySectors={taxonomySectorNames()}
        />
      </Card>
    </>
  );
}

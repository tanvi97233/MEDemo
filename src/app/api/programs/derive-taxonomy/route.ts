import { NextRequest, NextResponse } from "next/server";
import {
  deriveProgrammeTaxonomy,
  searchTaxonomySubsectors,
} from "@/lib/programme-taxonomy";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import JSZip from "jszip";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const sectors = request.nextUrl.searchParams.getAll("sector");
  const query = request.nextUrl.searchParams.get("q") ?? "";
  return NextResponse.json({
    results: searchTaxonomySubsectors(sectors, query),
  });
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";
  let description = "";
  let extractionNote: string | null = null;

  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File) || !file.name)
        return NextResponse.json(
          { error: "Choose a programme document." },
          { status: 400 },
        );

      if (file.size > 10 * 1024 * 1024)
        return NextResponse.json({ error: "The document exceeds the 10 MB limit." }, { status: 413 });
      const extension = file.name.split(".").pop()?.toLowerCase();
      const buffer = Buffer.from(await file.arrayBuffer());
      if (extension === "txt" || extension === "md") description = buffer.toString("utf8");
      else if (extension === "docx") {
        const result = await mammoth.extractRawText({ buffer });
        description = result.value;
        extractionNote = result.messages.length
          ? "Readable DOCX text was extracted with formatting omitted. Review the normalized draft."
          : "Readable DOCX text extracted successfully; formatting was intentionally omitted.";
      } else if (extension === "pptx") {
        const zip = await JSZip.loadAsync(buffer);
        const slideNames = Object.keys(zip.files)
          .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
          .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        const slides = await Promise.all(slideNames.map(async (name) => {
          const xml = await zip.file(name)?.async("string");
          return (xml?.match(/<a:t[^>]*>(.*?)<\/a:t>/g) ?? [])
            .map((value) => value.replace(/<\/?a:t[^>]*>/g, "").replaceAll("&amp;", "&"))
            .join(" ");
        }));
        description = slides.join("\n");
        extractionNote = "Readable PPTX slide text extracted successfully; visual layouts and images were omitted.";
      } else if (extension === "pdf") {
        const parser = new PDFParse({ data: buffer });
        try {
          description = (await parser.getText()).text;
        } finally {
          await parser.destroy();
        }
        extractionNote = "Readable PDF text extracted successfully. Scanned image-only pages may require OCR and are not claimed as processed.";
      } else {
        return NextResponse.json(
          { error: "Unsupported format. Use PDF, DOCX, PPTX, TXT, or MD. Legacy DOC/PPT files must be converted first." },
          { status: 415 },
        );
      }
      description = description.replace(/\s+/g, " ").trim().slice(0, 24000);
      if (description.length < 20)
        return NextResponse.json(
          { error: "No readable programme text was found. The file may be scanned, encrypted, or image-only." },
          { status: 422 },
        );
    } else {
      const body = (await request.json()) as { description?: unknown };
      description =
        typeof body.description === "string" ? body.description.trim() : "";
    }
  } catch {
    return NextResponse.json(
      { error: "The programme input could not be read." },
      { status: 400 },
    );
  }

  if (description.length < 12)
    return NextResponse.json(
      { error: "Provide a more detailed programme description." },
      { status: 400 },
    );

  const derived = await deriveProgrammeTaxonomy(description);
  return NextResponse.json({ description, derived, extractionNote });
}

import { analyzeUpload } from "@/lib/ai-analyzer";
import { logAudit } from "@/lib/audit";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  sanitizeTitle,
  validateDataLimits,
  validateUploadedFile,
} from "@/lib/sanitize";
import { parseSpreadsheet } from "@/lib/spreadsheet-parser";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = session.user.role?.toUpperCase() === "ADMIN";
  const uploads = await prisma.upload.findMany({
    where: isAdmin ? {} : { uploadedBy: session.user.id },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const data = uploads.map((u) => ({
    id: u.id,
    title: u.title,
    totalEntries: u.totalEntries,
    processedEntries: u.processedEntries,
    status: u.status,
    headers: JSON.parse(u.headers),
    aiSummary: u.aiSummary,
    aiTags: JSON.parse(u.aiTags),
    avgSeverity: u.avgSeverity,
    criticalCount: u.criticalCount,
    createdAt: u.createdAt.toISOString(),
    uploadedByName: u.user.name,
  }));

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const rawTitle = formData.get("title") as string | null;

    if (!file || !rawTitle) {
      return NextResponse.json(
        { error: "File and title are required" },
        { status: 400 },
      );
    }

    const title = sanitizeTitle(rawTitle);
    if (!title) {
      return NextResponse.json(
        { error: "Title cannot be empty after sanitization." },
        { status: 400 },
      );
    }

    const buffer = await file.arrayBuffer();

    const fileCheck = validateUploadedFile({
      name: file.name,
      size: file.size,
      buffer,
    });
    if (!fileCheck.valid) {
      return NextResponse.json({ error: fileCheck.error }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const text = ext === "csv" ? new TextDecoder().decode(buffer) : "";
    const { headers, rows } = parseSpreadsheet({
      name: file.name,
      buffer,
      text,
    });

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "File is empty or could not be parsed" },
        { status: 400 },
      );
    }

    const limitsCheck = validateDataLimits(rows, headers.length);
    if (!limitsCheck.valid) {
      return NextResponse.json({ error: limitsCheck.error }, { status: 400 });
    }

    const upload = await prisma.upload.create({
      data: {
        uploadedBy: session.user.id,
        title,
        totalEntries: rows.length,
        status: "parsing",
        headers: JSON.stringify(headers),
      },
    });

    const BATCH_INSERT_SIZE = 100;
    for (let i = 0; i < rows.length; i += BATCH_INSERT_SIZE) {
      const batch = rows.slice(i, i + BATCH_INSERT_SIZE);
      await prisma.surveyEntry.createMany({
        data: batch.map((row) => ({
          uploadId: upload.id,
          rawData: JSON.stringify(row),
        })),
      });
    }

    await prisma.upload.update({
      where: { id: upload.id },
      data: { status: "analyzing" },
    });

    // Log CREATE audit event
    logAudit({
      userId: session.user.id,
      action: "CREATE",
      entityType: "Upload",
      entityId: upload.id,
      entityTitle: title,
      details: { fileName: file.name, totalEntries: rows.length, headers },
    });

    analyzeUpload(upload.id).catch((err) =>
      console.error("Background analysis failed:", err),
    );

    return NextResponse.json({
      id: upload.id,
      status: "analyzing",
      totalEntries: rows.length,
    });
  } catch (error) {
    console.error("Upload failed:", error);
    return NextResponse.json(
      { error: "Failed to process upload" },
      { status: 500 },
    );
  }
}

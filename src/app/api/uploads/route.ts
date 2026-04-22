import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseCSV } from "@/lib/csv-parser";
import { analyzeUpload } from "@/lib/ai-analyzer";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = session.user.role === "ADMIN";
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
    const title = formData.get("title") as string | null;

    if (!file || !title) {
      return NextResponse.json(
        { error: "File and title are required" },
        { status: 400 }
      );
    }

    const fileContent = await file.text();
    const { headers, rows } = parseCSV(fileContent);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "CSV file is empty or could not be parsed" },
        { status: 400 }
      );
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

    analyzeUpload(upload.id).catch((err) =>
      console.error("Background analysis failed:", err)
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
      { status: 500 }
    );
  }
}

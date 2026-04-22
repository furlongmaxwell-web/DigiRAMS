import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const upload = await prisma.upload.findUnique({
    where: { id },
    include: { user: { select: { name: true } } },
  });

  if (!upload) {
    return NextResponse.json({ error: "Upload not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: upload.id,
    title: upload.title,
    totalEntries: upload.totalEntries,
    processedEntries: upload.processedEntries,
    status: upload.status,
    headers: JSON.parse(upload.headers),
    aiSummary: upload.aiSummary,
    aiTags: JSON.parse(upload.aiTags),
    avgSeverity: upload.avgSeverity,
    criticalCount: upload.criticalCount,
    createdAt: upload.createdAt.toISOString(),
    uploadedByName: upload.user.name,
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  await prisma.upload.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

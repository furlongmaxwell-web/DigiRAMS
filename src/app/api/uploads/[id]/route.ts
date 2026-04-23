import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

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

  // Log READ audit event (admin opened/viewed an upload)
  logAudit({
    userId: session.user.id,
    action: "READ",
    entityType: "Upload",
    entityId: upload.id,
    entityTitle: upload.title,
  });

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
  if (!session?.user || session.user.role?.toUpperCase() !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  // Fetch the upload before deleting so we can log its title
  const upload = await prisma.upload.findUnique({
    where: { id },
    select: { title: true, totalEntries: true },
  });

  await prisma.upload.delete({ where: { id } });

  // Log DELETE audit event
  logAudit({
    userId: session.user.id,
    action: "DELETE",
    entityType: "Upload",
    entityId: id,
    entityTitle: upload?.title ?? "Unknown",
    details: { totalEntries: upload?.totalEntries ?? 0 },
  });

  return NextResponse.json({ success: true });
}

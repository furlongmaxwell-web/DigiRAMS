import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const statusFilter = url.searchParams.get("status");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { volunteerId: session.user.id };
  if (statusFilter) {
    where.status = { in: statusFilter.split(",") };
  }

  const assignments = await prisma.assignment.findMany({
    where,
    include: {
      entry: {
        select: {
          id: true,
          rawData: true,
          severityLevel: true,
          severityReason: true,
          status: true,
          uploadId: true,
          upload: { select: { title: true } },
        },
      },
      assignedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const data = assignments.map((a) => ({
    id: a.id,
    entryId: a.entryId,
    status: a.status,
    note: a.note,
    volunteerNote: a.volunteerNote,
    assignedByName: a.assignedBy.name,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
    entry: {
      id: a.entry.id,
      severityLevel: a.entry.severityLevel,
      severityReason: a.entry.severityReason,
      entryStatus: a.entry.status,
      uploadId: a.entry.uploadId,
      uploadTitle: a.entry.upload.title,
      rawData: JSON.parse(a.entry.rawData),
    },
  }));

  return NextResponse.json(data);
}

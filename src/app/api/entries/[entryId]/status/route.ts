import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { AssignmentStatus } from "@/generated/prisma/client";

const VALID_STATUSES = new Set<string>(Object.values(AssignmentStatus));

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ entryId: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { entryId } = await params;
  const { status, note } = await req.json();

  if (!status || !VALID_STATUSES.has(status)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${[...VALID_STATUSES].join(", ")}` },
      { status: 400 },
    );
  }

  const assignment = await prisma.assignment.findUnique({
    where: { entryId },
    include: {
      volunteer: { select: { name: true } },
      assignedBy: { select: { id: true, name: true } },
      entry: { include: { upload: { select: { title: true } } } },
    },
  });

  if (!assignment) {
    return NextResponse.json({ error: "No assignment found for this entry" }, { status: 404 });
  }

  const isAdmin = session.user.role?.toUpperCase() === "ADMIN";
  const isAssignedVolunteer = assignment.volunteerId === session.user.id;

  if (!isAdmin && !isAssignedVolunteer) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const oldStatus = assignment.status;

  const updated = await prisma.assignment.update({
    where: { entryId },
    data: {
      status: status as AssignmentStatus,
      volunteerNote: note || assignment.volunteerNote,
    },
    include: { volunteer: { select: { name: true } } },
  });

  if (isAssignedVolunteer) {
    await prisma.notification.create({
      data: {
        userId: assignment.assignedBy.id,
        title: "Task Status Updated",
        message: `${assignment.volunteer.name} updated task status to ${status} for "${assignment.entry.upload.title}". ${note ? `Note: ${note}` : ""}`.trim(),
        linkUrl: `/dashboard/uploads/${assignment.entry.uploadId}`,
      },
    });
  } else if (isAdmin && assignment.volunteerId !== session.user.id) {
    await prisma.notification.create({
      data: {
        userId: assignment.volunteerId,
        title: "Task Status Changed",
        message: `Admin updated your task status to ${status} for "${assignment.entry.upload.title}". ${note ? `Note: ${note}` : ""}`.trim(),
        linkUrl: "/dashboard/tasks",
      },
    });
  }

  logAudit({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "Assignment",
    entityId: assignment.id,
    entityTitle: assignment.entry.upload.title,
    details: { oldStatus, newStatus: status, note },
  });

  return NextResponse.json({
    id: updated.id,
    entryId: updated.entryId,
    volunteerId: updated.volunteerId,
    volunteerName: updated.volunteer.name,
    status: updated.status,
    volunteerNote: updated.volunteerNote,
    updatedAt: updated.updatedAt.toISOString(),
  });
}

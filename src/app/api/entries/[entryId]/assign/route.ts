import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ entryId: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role?.toUpperCase() !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { entryId } = await params;
  const { volunteerId, note } = await req.json();

  if (!volunteerId) {
    return NextResponse.json({ error: "volunteerId is required" }, { status: 400 });
  }

  const entry = await prisma.surveyEntry.findUnique({
    where: { id: entryId },
    include: { upload: { select: { title: true } }, assignment: { include: { volunteer: { select: { name: true } } } } },
  });

  if (!entry) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  const volunteer = await prisma.user.findUnique({
    where: { id: volunteerId, role: "VOLUNTEER" },
    select: { id: true, name: true },
  });

  if (!volunteer) {
    return NextResponse.json({ error: "Volunteer not found" }, { status: 404 });
  }

  const isReassign = !!entry.assignment;
  const oldVolunteerName = entry.assignment?.volunteer.name;

  if (entry.assignment) {
    await prisma.assignment.delete({ where: { entryId } });
  }

  const assignment = await prisma.assignment.create({
    data: {
      entryId,
      volunteerId,
      assignedById: session.user.id,
      note: note || "",
    },
    include: { volunteer: { select: { name: true } } },
  });

  await prisma.notification.create({
    data: {
      userId: volunteerId,
      title: isReassign ? "Task Reassigned" : "New Task Assigned",
      message: `You have been ${isReassign ? "reassigned" : "assigned"} a task from "${entry.upload.title}". ${note ? `Note: ${note}` : ""}`.trim(),
      linkUrl: "/dashboard/tasks",
    },
  });

  logAudit({
    userId: session.user.id,
    action: isReassign ? "UPDATE" : "CREATE",
    entityType: "Assignment",
    entityId: assignment.id,
    entityTitle: entry.upload.title,
    details: {
      action: isReassign ? "reassign" : "assign",
      entryId,
      volunteerId,
      volunteerName: volunteer.name,
      ...(isReassign ? { previousVolunteer: oldVolunteerName } : {}),
      note,
    },
  });

  return NextResponse.json({
    id: assignment.id,
    entryId: assignment.entryId,
    volunteerId: assignment.volunteerId,
    volunteerName: assignment.volunteer.name,
    status: assignment.status,
    note: assignment.note,
    createdAt: assignment.createdAt.toISOString(),
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ entryId: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role?.toUpperCase() !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { entryId } = await params;

  const assignment = await prisma.assignment.findUnique({
    where: { entryId },
    include: {
      volunteer: { select: { name: true } },
      entry: { include: { upload: { select: { title: true } } } },
    },
  });

  if (!assignment) {
    return NextResponse.json({ error: "No assignment found" }, { status: 404 });
  }

  await prisma.assignment.delete({ where: { entryId } });

  await prisma.notification.create({
    data: {
      userId: assignment.volunteerId,
      title: "Task Unassigned",
      message: `Your task from "${assignment.entry.upload.title}" has been unassigned.`,
      linkUrl: "/dashboard/tasks",
    },
  });

  logAudit({
    userId: session.user.id,
    action: "DELETE",
    entityType: "Assignment",
    entityId: assignment.id,
    entityTitle: assignment.entry.upload.title,
    details: {
      action: "unassign",
      entryId,
      volunteerId: assignment.volunteerId,
      volunteerName: assignment.volunteer.name,
    },
  });

  return NextResponse.json({ success: true });
}

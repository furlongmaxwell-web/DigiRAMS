import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashSync } from "bcryptjs";
import { logAudit, diffChanges } from "@/lib/audit";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role?.toUpperCase() !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { name, email, password, skills, region, availability } = body;

  // Capture old values for diff
  const oldUser = await prisma.user.findUnique({
    where: { id },
    select: { name: true, email: true, skills: true, region: true, availability: true },
  });

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (email !== undefined) updateData.email = email;
  if (password) updateData.password = hashSync(password, 12);
  if (skills !== undefined) updateData.skills = JSON.stringify(skills);
  if (region !== undefined) updateData.region = region;
  if (availability !== undefined) updateData.availability = availability;

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
  });

  // Log UPDATE audit event with diff
  if (oldUser) {
    const oldData: Record<string, unknown> = {
      name: oldUser.name,
      email: oldUser.email,
      skills: oldUser.skills,
      region: oldUser.region,
      availability: oldUser.availability,
    };
    const newData: Record<string, unknown> = {
      name: user.name,
      email: user.email,
      skills: user.skills,
      region: user.region,
      availability: user.availability,
    };
    const diff = diffChanges(oldData, newData);
    if (diff.changed) {
      logAudit({
        userId: session.user.id,
        action: "UPDATE",
        entityType: "User",
        entityId: id,
        entityTitle: user.name,
        details: diff.changes,
      });
    }
  }

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    skills: JSON.parse(user.skills),
    region: user.region,
    availability: user.availability,
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

  // Capture name before deletion
  const user = await prisma.user.findUnique({
    where: { id },
    select: { name: true, email: true },
  });

  await prisma.user.delete({ where: { id } });

  // Log DELETE audit event
  logAudit({
    userId: session.user.id,
    action: "DELETE",
    entityType: "User",
    entityId: id,
    entityTitle: user?.name ?? "Unknown",
    details: { email: user?.email },
  });

  return NextResponse.json({ success: true });
}

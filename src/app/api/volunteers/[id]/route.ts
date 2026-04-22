import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashSync } from "bcryptjs";

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
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

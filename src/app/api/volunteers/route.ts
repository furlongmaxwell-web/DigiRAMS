import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashSync } from "bcryptjs";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const volunteers = await prisma.user.findMany({
    where: { role: "VOLUNTEER" },
    select: {
      id: true,
      name: true,
      email: true,
      skills: true,
      region: true,
      availability: true,
      createdAt: true,
      _count: { select: { uploads: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const data = volunteers.map((v) => ({
    id: v.id,
    name: v.name,
    email: v.email,
    skills: JSON.parse(v.skills),
    region: v.region,
    availability: v.availability,
    createdAt: v.createdAt.toISOString(),
    uploadsCount: v._count.uploads,
  }));

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role?.toUpperCase() !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, email, password, skills, region } = body;

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "Name, email, and password are required" },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "A user with this email already exists" },
      { status: 409 }
    );
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashSync(password, 12),
      role: "VOLUNTEER",
      skills: JSON.stringify(skills || []),
      region: region || null,
    },
  });

  // Log CREATE audit event
  logAudit({
    userId: session.user.id,
    action: "CREATE",
    entityType: "User",
    entityId: user.id,
    entityTitle: user.name,
    details: { email: user.email, role: "VOLUNTEER", region: user.region },
  });

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    skills: JSON.parse(user.skills),
    region: user.region,
  });
}

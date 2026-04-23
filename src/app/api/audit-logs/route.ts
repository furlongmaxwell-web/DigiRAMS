import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role?.toUpperCase() !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "25")));
    const action = url.searchParams.get("action");
    const entityType = url.searchParams.get("entityType");
    const search = url.searchParams.get("search");
    const sortOrder = url.searchParams.get("sortOrder") === "asc" ? "asc" as const : "desc" as const;
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    // Build where clause compatible with Prisma + SQLite
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (action && ["CREATE", "READ", "UPDATE", "DELETE"].includes(action.toUpperCase())) {
      where.action = action.toUpperCase();
    }

    if (entityType) {
      where.entityType = entityType;
    }

    if (search) {
      where.entityTitle = { contains: search };
    }

    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = toDate;
      }
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { name: true, email: true, role: true } },
        },
        orderBy: { createdAt: sortOrder },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    const data = logs.map((log) => ({
      id: log.id,
      userId: log.userId,
      userName: log.user.name,
      userEmail: log.user.email,
      userRole: log.user.role,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      entityTitle: log.entityTitle,
      details: JSON.parse(log.details),
      ipAddress: log.ipAddress,
      createdAt: log.createdAt.toISOString(),
    }));

    return NextResponse.json({
      logs: data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[AuditLogs API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}

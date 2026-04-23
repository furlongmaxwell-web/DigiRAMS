import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "50");
  const sortBy = url.searchParams.get("sortBy") || "severityLevel";
  const sortOrder = url.searchParams.get("sortOrder") || "desc";
  const search = url.searchParams.get("search") || "";
  const statusFilter = url.searchParams.get("status") || "";
  const severityFilter = url.searchParams.get("severity") || "";

  const skip = (page - 1) * limit;

  const orderBy: Record<string, string> = {};
  if (sortBy === "severityLevel" || sortBy === "status" || sortBy === "createdAt") {
    orderBy[sortBy] = sortOrder;
  } else {
    orderBy["createdAt"] = "desc";
  }

  const whereClause: any = { uploadId: id };
  if (search) {
    whereClause.rawData = { contains: search, mode: "insensitive" };
  }
  if (statusFilter) {
    whereClause.status = { in: statusFilter.split(",") };
  }
  if (severityFilter) {
    whereClause.severityLevel = { in: severityFilter.split(",") };
  }

  const [entries, total] = await Promise.all([
    prisma.surveyEntry.findMany({
      where: whereClause,
      include: {
        assignment: {
          select: {
            id: true,
            status: true,
            note: true,
            volunteerNote: true,
            volunteer: { select: { id: true, name: true } },
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.surveyEntry.count({ where: whereClause }),
  ]);

  const data = entries.map((e) => ({
    id: e.id,
    rawData: JSON.parse(e.rawData),
    severityLevel: e.severityLevel,
    severityReason: e.severityReason,
    status: e.status,
    createdAt: e.createdAt.toISOString(),
    assignment: e.assignment
      ? {
          id: e.assignment.id,
          status: e.assignment.status,
          note: e.assignment.note,
          volunteerNote: e.assignment.volunteerNote,
          volunteerId: e.assignment.volunteer.id,
          volunteerName: e.assignment.volunteer.name,
        }
      : null,
  }));

  return NextResponse.json({
    entries: data,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

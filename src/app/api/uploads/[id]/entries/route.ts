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

  const skip = (page - 1) * limit;

  const orderBy: Record<string, string> = {};
  if (sortBy === "severityLevel" || sortBy === "status" || sortBy === "createdAt") {
    orderBy[sortBy] = sortOrder;
  } else {
    orderBy["createdAt"] = "desc";
  }

  const [entries, total] = await Promise.all([
    prisma.surveyEntry.findMany({
      where: { uploadId: id },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.surveyEntry.count({ where: { uploadId: id } }),
  ]);

  const data = entries.map((e) => ({
    id: e.id,
    rawData: JSON.parse(e.rawData),
    severityLevel: e.severityLevel,
    severityReason: e.severityReason,
    status: e.status,
    createdAt: e.createdAt.toISOString(),
  }));

  return NextResponse.json({
    entries: data,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

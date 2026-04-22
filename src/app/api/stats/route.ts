import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = session.user.role?.toUpperCase() === "ADMIN";
  const scopeParam = req.nextUrl.searchParams.get("scope");
  const filterByUser = scopeParam === "me" || !isAdmin;
  const userId = filterByUser ? session.user.id : undefined;

  const uploadWhere = userId ? { uploadedBy: userId } : {};
  const entryWhere = userId ? { upload: { uploadedBy: userId } } : {};

  const [
    totalUploads,
    totalEntries,
    totalVolunteers,
    uploads,
    entries,
  ] = await Promise.all([
    prisma.upload.count({ where: uploadWhere }),
    prisma.surveyEntry.count({ where: entryWhere }),
    isAdmin ? prisma.user.count({ where: { role: "VOLUNTEER" } }) : Promise.resolve(0),
    prisma.upload.findMany({
      where: uploadWhere,
      select: {
        id: true,
        title: true,
        totalEntries: true,
        criticalCount: true,
        avgSeverity: true,
        aiSummary: true,
        aiTags: true,
        status: true,
        createdAt: true,
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.surveyEntry.findMany({
      where: entryWhere,
      select: { severityLevel: true, status: true, rawData: true },
    }),
  ]);

  const severityOrder = ["MINIMAL", "LOW", "MODERATE", "HIGH", "CRITICAL"];
  const severityDistribution = [0, 0, 0, 0, 0];
  let resolvedCount = 0;
  let pendingCount = 0;
  let noActionCount = 0;
  const regionCounts: Record<string, number> = {};
  const tagCounts: Record<string, number> = {};

  for (const entry of entries) {
    if (entry.severityLevel) {
      const idx = severityOrder.indexOf(entry.severityLevel);
      if (idx >= 0) severityDistribution[idx]++;
    }
    if (entry.status === "RESOLVED") resolvedCount++;
    else if (entry.status === "PENDING") pendingCount++;
    else noActionCount++;

    try {
      const raw = JSON.parse(entry.rawData);
      const region =
        raw.state_province || raw.region || raw.state || raw.country || "Unknown";
      if (region && region !== "") {
        regionCounts[region] = (regionCounts[region] || 0) + 1;
      }
    } catch {
      // skip malformed rawData
    }
  }

  for (const upload of uploads) {
    try {
      const tags: string[] = JSON.parse(upload.aiTags);
      for (const tag of tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    } catch {
      // skip
    }
  }

  const criticalCount = severityDistribution[3] + severityDistribution[4];

  const regionData = Object.entries(regionCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const tagData = Object.entries(tagCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const uploadsTimeline = uploads.map((u) => ({
    date: u.createdAt.toISOString().split("T")[0],
    entries: u.totalEntries,
    title: u.title,
  }));

  return NextResponse.json({
    totalUploads,
    totalEntries,
    totalVolunteers,
    criticalCount,
    resolvedCount,
    pendingCount,
    noActionCount,
    severityDistribution: severityDistribution.map((count, i) => ({
      level: i + 1,
      label: ["Minimal", "Low", "Moderate", "High", "Critical"][i],
      count,
    })),
    regionData,
    tagData,
    uploadsTimeline,
    uploads: uploads.map((u) => ({
      id: u.id,
      title: u.title,
      totalEntries: u.totalEntries,
      criticalCount: u.criticalCount,
      avgSeverity: u.avgSeverity,
      aiSummary: u.aiSummary,
      status: u.status,
      createdAt: u.createdAt.toISOString(),
      uploadedByName: u.user.name,
    })),
  });
}

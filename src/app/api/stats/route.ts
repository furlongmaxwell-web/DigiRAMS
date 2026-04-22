import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [
    totalUploads,
    totalEntries,
    totalVolunteers,
    uploads,
    entries,
  ] = await Promise.all([
    prisma.upload.count(),
    prisma.surveyEntry.count(),
    prisma.user.count({ where: { role: "VOLUNTEER" } }),
    prisma.upload.findMany({
      select: {
        id: true,
        title: true,
        totalEntries: true,
        criticalCount: true,
        avgSeverity: true,
        aiTags: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.surveyEntry.findMany({
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
    recentUploads: uploads.slice(0, 5).map((u) => ({
      id: u.id,
      title: u.title,
      totalEntries: u.totalEntries,
      criticalCount: u.criticalCount,
      avgSeverity: u.avgSeverity,
      status: u.status,
      createdAt: u.createdAt.toISOString(),
    })),
  });
}

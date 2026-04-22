"use client";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  ChevronRight,
  FileSpreadsheet,
  ShieldAlert,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface UploadItem {
  id: string;
  title: string;
  totalEntries: number;
  criticalCount: number;
  avgSeverity: number | null;
  aiSummary: string | null;
  status: string;
  createdAt: string;
  uploadedByName: string;
}

interface Stats {
  totalUploads: number;
  totalEntries: number;
  totalVolunteers: number;
  criticalCount: number;
  resolvedCount: number;
  pendingCount: number;
  noActionCount: number;
  severityDistribution: { level: number; label: string; count: number }[];
  regionData: { name: string; count: number }[];
  tagData: { name: string; count: number }[];
  uploads: UploadItem[];
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function severityColor(level: number): string {
  return (
    [
      "bg-emerald-500",
      "bg-lime-500",
      "bg-amber-500",
      "bg-orange-500",
      "bg-red-500",
    ][level - 1] ?? "bg-muted"
  );
}

function severityBadge(avg: number | null): { text: string; cls: string } {
  if (avg === null)
    return { text: "N/A", cls: "bg-muted text-muted-foreground" };
  if (avg >= 4)
    return {
      text: "Critical",
      cls: "bg-red-500/15 text-red-500 border border-red-500/25",
    };
  if (avg >= 3)
    return {
      text: "High",
      cls: "bg-orange-500/15 text-orange-500 border border-orange-500/25",
    };
  if (avg >= 2)
    return {
      text: "Medium",
      cls: "bg-amber-500/15 text-amber-500 border border-amber-500/25",
    };
  return {
    text: "Low",
    cls: "bg-emerald-500/15 text-emerald-500 border border-emerald-500/25",
  };
}

function DashboardSkeleton() {
  return (
    <div className="flex h-full gap-0">
      <div className="flex-1 grid grid-cols-3 gap-6 p-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-full min-h-[400px] rounded-2xl" />
        ))}
      </div>
      <div className="w-80 space-y-4 border-l border-border p-6">
        <Skeleton className="h-6 w-32" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data: Stats) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !stats) return <DashboardSkeleton />;

  const maxSeverity = Math.max(
    ...stats.severityDistribution.map((s) => s.count),
    1,
  );
  const resolvedPct =
    stats.totalEntries > 0
      ? Math.round((stats.resolvedCount / stats.totalEntries) * 100)
      : 0;
  const pendingPct =
    stats.totalEntries > 0
      ? Math.round((stats.pendingCount / stats.totalEntries) * 100)
      : 0;
  const noActionPct =
    stats.totalEntries > 0 ? 100 - resolvedPct - pendingPct : 0;

  return (
    <div className="flex h-[calc(100vh-57px-3rem)] overflow-hidden -m-6">
      {/* Main content: 3-card grid */}
      <div className="flex-1 overflow-hidden p-6">
        <div className="grid h-full grid-cols-3 gap-5">
          {/* Card 1: Severity Overview */}
          <div className="flex flex-col rounded-[1.5rem] border-2 border-primary/60 bg-card overflow-hidden min-h-0">
            <div className="bg-primary px-6 py-5 shrink-0">
              <div className="flex items-center gap-3">
                <ShieldAlert className="size-6 text-foreground" />
                <h2 className="text-xl font-extrabold text-foreground">
                  Severity Overview
                </h2>
              </div>
            </div>
            <div className="flex-1 p-6 flex flex-col gap-5 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-muted/50 p-4 text-center">
                  <p className="text-3xl font-black tabular-nums text-foreground">
                    {stats.totalEntries.toLocaleString()}
                  </p>
                  <p className="text-[11px] font-semibold text-muted-foreground mt-1 uppercase tracking-wider">
                    Total Entries
                  </p>
                </div>
                <div className="rounded-xl bg-red-500/10 p-4 text-center">
                  <p className="text-3xl font-black tabular-nums text-red-500">
                    {stats.criticalCount.toLocaleString()}
                  </p>
                  <p className="text-[11px] font-semibold text-muted-foreground mt-1 uppercase tracking-wider">
                    Critical
                  </p>
                </div>
              </div>

              <div className="flex-1 space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  Distribution
                </p>
                {stats.severityDistribution.map((s) => {
                  const pct =
                    maxSeverity > 0 ? (s.count / maxSeverity) * 100 : 0;
                  return (
                    <div key={s.level} className="group">
                      <div className="flex items-center justify-between text-[12px] mb-1.5">
                        <span className="font-semibold text-foreground">
                          {s.label}
                        </span>
                        <span className="font-bold tabular-nums text-muted-foreground">
                          {s.count}
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full bg-muted/60 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${severityColor(s.level)}`}
                          style={{ width: `${Math.max(pct, 2)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Card 2: Analytics Hub */}
          <div className="flex flex-col rounded-[1.5rem] border-2 border-cyan-800/60 bg-card overflow-hidden min-h-0">
            <div className="bg-cyan-800 px-6 py-5 shrink-0">
              <div className="flex items-center gap-3">
                <Activity className="size-6 text-foreground" />
                <h2 className="text-xl font-extrabold text-foreground">
                  Analytics Hub
                </h2>
              </div>
            </div>
            <div className="flex-1 p-6 px-4 pt-0 flex flex-col gap-5 overflow-y-auto">
              {/* Status donut-style bars */}
              <div className="rounded-xl bg-muted/30 p-4 space-y-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  Case Status
                </p>
                <div className="h-4 rounded-full bg-muted/50 overflow-hidden flex">
                  {resolvedPct > 0 && (
                    <div
                      className="h-full bg-emerald-500 transition-all duration-700"
                      style={{ width: `${resolvedPct}%` }}
                    />
                  )}
                  {pendingPct > 0 && (
                    <div
                      className="h-full bg-amber-500 transition-all duration-700"
                      style={{ width: `${pendingPct}%` }}
                    />
                  )}
                  {noActionPct > 0 && (
                    <div
                      className="h-full bg-muted-foreground/30 transition-all duration-700"
                      style={{ width: `${noActionPct}%` }}
                    />
                  )}
                </div>
                <div className="flex gap-4 text-[11px]">
                  <div className="flex items-center gap-1.5 bg-emerald-500 border border-emerald-500/15 rounded-lg p-2">
                    <span className="font-medium text-foreground">
                      Resolved{" "}
                      <span className="font-bold text-foreground">
                        {stats.resolvedCount}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-amber-500 border border-amber-500/15 rounded-lg p-2">
                    <span className="font-medium text-foreground">
                      Pending{" "}
                      <span className="font-bold text-foreground">
                        {stats.pendingCount}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-muted-foreground/30 border border-muted-foreground/15 rounded-lg p-2">
                    <span className="font-medium text-foreground">
                      None{" "}
                      <span className="font-bold text-foreground">
                        {stats.noActionCount}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Top regions */}
              <div className="flex-1 space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  Top Regions
                </p>
                {stats.regionData.slice(0, 5).map((r, i) => (
                  <div
                    key={r.name}
                    className="flex items-center gap-3 rounded-lg bg-muted/30 px-3 py-2.5"
                  >
                    <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-[11px] font-bold text-primary">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-[13px] font-medium text-foreground truncate">
                      {r.name}
                    </span>
                    <span className="text-[12px] font-bold tabular-nums text-muted-foreground">
                      {r.count}
                    </span>
                  </div>
                ))}
                {stats.regionData.length === 0 && (
                  <p className="text-[12px] text-muted-foreground italic py-4 text-center">
                    No region data available
                  </p>
                )}
              </div>

              {/* Tags */}
              {stats.tagData.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                    Top Tags
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {stats.tagData.slice(0, 6).map((t) => (
                      <span
                        key={t.name}
                        className="inline-flex items-center gap-1.5 rounded-full bg-primary/8 px-3 py-1 text-[11px] font-semibold text-primary"
                      >
                        {t.name}
                        <span className="text-primary/50">{t.count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card 3: Team & Performance */}
          <div className="flex flex-col rounded-[1.5rem] border-2 border-emerald-500/40 bg-card overflow-hidden min-h-0">
            <div className="bg-emerald-500 px-6 py-5 shrink-0">
              <div className="flex items-center gap-3">
                <Users className="size-6 text-white" />
                <h2 className="text-xl font-extrabold text-white">
                  Team & Status
                </h2>
              </div>
            </div>
            <div className="flex-1 p-6 flex flex-col gap-5 overflow-y-auto">
              {/* Quick metric cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-muted/50 p-4 text-center">
                  <p className="text-3xl font-black tabular-nums text-foreground">
                    {stats.totalVolunteers}
                  </p>
                  <p className="text-[11px] font-semibold text-muted-foreground mt-1 uppercase tracking-wider">
                    Volunteers
                  </p>
                </div>
                <div className="rounded-xl bg-muted/50 p-4 text-center">
                  <p className="text-3xl font-black tabular-nums text-foreground">
                    {stats.totalUploads}
                  </p>
                  <p className="text-[11px] font-semibold text-muted-foreground mt-1 uppercase tracking-wider">
                    Uploads
                  </p>
                </div>
              </div>

              {/* Resolution rate */}
              <div className="rounded-xl bg-emerald-500/8 border border-emerald-500/15 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-bold text-foreground">
                    Resolution Rate
                  </p>
                  <span className="text-2xl font-black tabular-nums text-emerald-500">
                    {resolvedPct}%
                  </span>
                </div>
                <div className="h-3 rounded-full bg-muted/60 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                    style={{ width: `${resolvedPct}%` }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {stats.resolvedCount} of {stats.totalEntries} entries resolved
                </p>
              </div>

              {/* Per-upload breakdown */}
              <div className="flex-1 space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  Upload Performance
                </p>
                <div className="space-y-2 max-h-[250px] overflow-y-auto">
                  {stats.uploads.slice(0, 6).map((u) => {
                    const sev = severityBadge(u.avgSeverity);
                    return (
                      <button
                        key={u.id}
                        onClick={() =>
                          router.push(`/dashboard/uploads/${u.id}`)
                        }
                        className="w-full flex items-center gap-3 rounded-lg bg-muted/30 px-3 py-2.5 text-left transition-colors hover:bg-muted/60 group cursor-pointer"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold text-foreground truncate">
                            {u.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {u.totalEntries} entries
                          </p>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-1 rounded-lg ${sev.cls}`}
                        >
                          {sev.text}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right sidebar: Latest Uploads */}
      <aside className="hidden lg:flex w-80 shrink-0 flex-col border-l border-border bg-card/50 overflow-y-auto">
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-bold text-foreground">Latest Uploads</h3>

          {stats.uploads.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/60 mb-3">
                <FileSpreadsheet className="size-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-semibold text-foreground">
                No uploads yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Data will appear here after the first upload
              </p>
            </div>
          )}

          {stats.uploads.map((upload) => {
            const sev = severityBadge(upload.avgSeverity);
            return (
              <button
                key={upload.id}
                onClick={() => router.push(`/dashboard/uploads/${upload.id}`)}
                className="w-full rounded-2xl border border-border bg-card p-5 flex flex-col gap-3 text-left transition-all hover:border-primary/30 hover:shadow-md group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted/60">
                    <FileSpreadsheet className="size-4 text-muted-foreground" />
                  </div>
                  <span className="text-[14px] font-bold text-foreground truncate flex-1">
                    {upload.title}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-muted-foreground">
                    {upload.totalEntries} entries
                    {upload.criticalCount > 0 && (
                      <>
                        {" "}
                        &middot;{" "}
                        <span className="text-red-500 font-semibold">
                          {upload.criticalCount} critical
                        </span>
                      </>
                    )}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${sev.cls}`}
                  >
                    {sev.text}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground/60">
                    {timeAgo(upload.createdAt)}
                  </span>
                  <ChevronRight className="size-4 text-muted-foreground/30 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
                </div>
              </button>
            );
          })}
        </div>
      </aside>
    </div>
  );
}

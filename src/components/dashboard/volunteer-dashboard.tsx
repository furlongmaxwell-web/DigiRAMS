"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  FileSpreadsheet,
  Database,
  ChevronRight,
  Clock,
  CheckCircle2,
  ShieldAlert,
  Upload,
  PlusCircle,
  BarChart3,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface UploadItem {
  id: string
  title: string
  totalEntries: number
  criticalCount: number
  avgSeverity: number | null
  aiSummary: string | null
  status: string
  createdAt: string
  uploadedByName: string
}

interface Stats {
  totalUploads: number
  totalEntries: number
  criticalCount: number
  resolvedCount: number
  pendingCount: number
  noActionCount: number
  severityDistribution: { level: number; label: string; count: number }[]
  regionData: { name: string; count: number }[]
  uploads: UploadItem[]
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

function severityColor(level: number): string {
  return ["bg-emerald-500", "bg-lime-500", "bg-amber-500", "bg-orange-500", "bg-red-500"][level - 1] ?? "bg-muted"
}

function severityBadge(avg: number | null): { text: string; cls: string } {
  if (avg === null) return { text: "N/A", cls: "bg-muted text-muted-foreground" }
  if (avg >= 4) return { text: "Critical", cls: "bg-red-500/15 text-red-500 border border-red-500/25" }
  if (avg >= 3) return { text: "High", cls: "bg-orange-500/15 text-orange-500 border border-orange-500/25" }
  if (avg >= 2) return { text: "Medium", cls: "bg-amber-500/15 text-amber-500 border border-amber-500/25" }
  return { text: "Low", cls: "bg-emerald-500/15 text-emerald-500 border border-emerald-500/25" }
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
  )
}

interface Props {
  userName: string
}

export function VolunteerDashboard({ userName }: Props) {
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/stats?scope=me")
      .then((res) => res.json())
      .then((data: Stats) => {
        setStats(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading || !stats) return <DashboardSkeleton />

  const maxSeverity = Math.max(...stats.severityDistribution.map((s) => s.count), 1)
  const resolvedPct = stats.totalEntries > 0 ? Math.round((stats.resolvedCount / stats.totalEntries) * 100) : 0

  return (
    <div className="flex min-h-[calc(100vh-57px-3rem)] -m-6">
      {/* Main content: 3-card grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <h1 className="text-lg font-bold text-foreground tracking-tight">
            Welcome back, {userName}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Here&apos;s an overview of your uploaded data
          </p>
        </div>

        <div className="grid h-[calc(100%-4rem)] grid-cols-3 gap-5">

          {/* Card 1: My Severity Data */}
          <div className="flex flex-col rounded-[1.5rem] border-2 border-primary/60 bg-card overflow-hidden">
            <div className="bg-primary px-6 py-5">
              <div className="flex items-center gap-3">
                <ShieldAlert className="size-6 text-primary-foreground" />
                <h2 className="text-xl font-extrabold text-primary-foreground">
                  My Severity Data
                </h2>
              </div>
            </div>
            <div className="flex-1 p-6 flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-muted/50 p-4 text-center">
                  <p className="text-3xl font-black tabular-nums text-foreground">
                    {stats.totalEntries.toLocaleString()}
                  </p>
                  <p className="text-[11px] font-semibold text-muted-foreground mt-1 uppercase tracking-wider">
                    My Entries
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
                  const pct = maxSeverity > 0 ? (s.count / maxSeverity) * 100 : 0
                  return (
                    <div key={s.level}>
                      <div className="flex items-center justify-between text-[12px] mb-1.5">
                        <span className="font-semibold text-foreground">{s.label}</span>
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
                  )
                })}
              </div>
            </div>
          </div>

          {/* Card 2: My Analytics */}
          <div className="flex flex-col rounded-[1.5rem] border border-border bg-card overflow-hidden">
            <div className="px-6 py-5">
              <div className="flex items-center gap-3">
                <BarChart3 className="size-6 text-foreground" />
                <h2 className="text-xl font-extrabold text-foreground">
                  My Analytics
                </h2>
              </div>
            </div>
            <div className="flex-1 p-6 pt-0 flex flex-col gap-5">
              <div className="rounded-xl bg-muted/30 p-4 space-y-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  Case Status
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-emerald-500" />
                      <span className="text-[13px] font-medium text-foreground">Resolved</span>
                    </div>
                    <span className="text-[15px] font-bold tabular-nums text-emerald-500">
                      {stats.resolvedCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="size-4 text-amber-500" />
                      <span className="text-[13px] font-medium text-foreground">Pending</span>
                    </div>
                    <span className="text-[15px] font-bold tabular-nums text-amber-500">
                      {stats.pendingCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="size-4 text-muted-foreground" />
                      <span className="text-[13px] font-medium text-foreground">No Action</span>
                    </div>
                    <span className="text-[15px] font-bold tabular-nums text-muted-foreground">
                      {stats.noActionCount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Top regions from my data */}
              {stats.regionData.length > 0 && (
                <div className="flex-1 space-y-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                    My Top Regions
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
                </div>
              )}

              {/* Resolution rate */}
              <div className="rounded-xl bg-emerald-500/8 border border-emerald-500/15 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-bold text-foreground">My Resolution Rate</p>
                  <span className="text-xl font-black tabular-nums text-emerald-500">
                    {resolvedPct}%
                  </span>
                </div>
                <div className="h-3 rounded-full bg-muted/60 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                    style={{ width: `${resolvedPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Quick Actions + Upload Summary */}
          <div className="flex flex-col rounded-[1.5rem] border-2 border-emerald-500/40 bg-card overflow-hidden">
            <div className="bg-emerald-500 px-6 py-5">
              <div className="flex items-center gap-3">
                <Upload className="size-6 text-white" />
                <h2 className="text-xl font-extrabold text-white">
                  Quick Actions
                </h2>
              </div>
            </div>
            <div className="flex-1 p-6 flex flex-col gap-5">
              <button
                onClick={() => router.push("/dashboard/uploads/new")}
                className="w-full flex items-center gap-3 rounded-xl bg-emerald-500 px-5 py-4 text-white font-bold text-[15px] transition-all hover:brightness-110 active:scale-[0.98]"
              >
                <PlusCircle className="size-5" />
                New Upload
              </button>

              <button
                onClick={() => router.push("/dashboard/uploads")}
                className="w-full flex items-center gap-3 rounded-xl border-2 border-border px-5 py-4 font-bold text-[15px] text-foreground transition-all hover:bg-muted/50"
              >
                <FileSpreadsheet className="size-5 text-muted-foreground" />
                View All Uploads
              </button>

              {/* My uploads mini list */}
              <div className="flex-1 space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  My Recent Uploads
                </p>
                <div className="space-y-2 max-h-[280px] overflow-y-auto">
                  {stats.uploads.slice(0, 5).map((u) => {
                    const sev = severityBadge(u.avgSeverity)
                    return (
                      <button
                        key={u.id}
                        onClick={() => router.push(`/dashboard/uploads/${u.id}`)}
                        className="w-full flex items-center gap-3 rounded-lg bg-muted/30 px-3 py-2.5 text-left transition-colors hover:bg-muted/60 group"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold text-foreground truncate">
                            {u.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {u.totalEntries} entries &middot; {timeAgo(u.createdAt)}
                          </p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg shrink-0 ${sev.cls}`}>
                          {sev.text}
                        </span>
                      </button>
                    )
                  })}
                  {stats.uploads.length === 0 && (
                    <p className="text-[12px] text-muted-foreground italic py-4 text-center">
                      No uploads yet. Create your first one!
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right sidebar: My Uploads */}
      <aside className="hidden lg:flex w-80 shrink-0 flex-col border-l border-border bg-card/50 overflow-y-auto">
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-bold text-foreground">My Uploads</h3>

          {stats.uploads.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/60 mb-3">
                <FileSpreadsheet className="size-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-semibold text-foreground">No uploads yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Upload a dataset to see your data here
              </p>
            </div>
          )}

          {stats.uploads.map((upload) => {
            const sev = severityBadge(upload.avgSeverity)
            return (
              <button
                key={upload.id}
                onClick={() => router.push(`/dashboard/uploads/${upload.id}`)}
                className="w-full rounded-2xl border border-border bg-card p-5 flex flex-col gap-3 text-left transition-all hover:border-primary/30 hover:shadow-md group"
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
                      <> &middot; <span className="text-red-500 font-semibold">{upload.criticalCount} critical</span></>
                    )}
                  </span>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${sev.cls}`}>
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
            )
          })}
        </div>
      </aside>
    </div>
  )
}

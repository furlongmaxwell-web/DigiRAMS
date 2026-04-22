"use client"

import { useEffect, useState } from "react"
import {
  FileSpreadsheet,
  Database,
  AlertTriangle,
  Users,
} from "lucide-react"
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { DashboardSkeleton } from "@/components/skeletons/dashboard-skeleton"

interface Stats {
  totalUploads: number
  totalEntries: number
  totalVolunteers: number
  criticalCount: number
  resolvedCount: number
  pendingCount: number
  noActionCount: number
  severityDistribution: { level: number; label: string; count: number }[]
  regionData: { name: string; count: number }[]
  tagData: { name: string; count: number }[]
  uploadsTimeline: { date: string; entries: number; title: string }[]
  recentUploads: {
    id: string
    title: string
    totalEntries: number
    criticalCount: number
    avgSeverity: number | null
    status: string
    createdAt: string
  }[]
}

const SEVERITY_COLORS: Record<number, string> = {
  1: "#22c55e",
  2: "#84cc16",
  3: "#eab308",
  4: "#f97316",
  5: "#ef4444",
}

const TOOLTIP_STYLE: React.CSSProperties = {
  borderRadius: "0.5rem",
  border: "1px solid hsl(var(--border))",
  backgroundColor: "hsl(var(--card))",
  color: "hsl(var(--card-foreground))",
  boxShadow: "0 4px 12px rgb(0 0 0 / .15)",
}

function statusVariant(status: string) {
  switch (status) {
    case "done":
      return "default" as const
    case "analyzing":
      return "secondary" as const
    case "failed":
      return "destructive" as const
    default:
      return "outline" as const
  }
}

function statusColor(status: string) {
  switch (status) {
    case "done":
      return "bg-green-500/15 text-green-700 dark:text-green-400"
    case "analyzing":
      return "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400"
    case "failed":
      return "bg-red-500/15 text-red-700 dark:text-red-400"
    default:
      return ""
  }
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data: Stats) => {
        setStats(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading || !stats) {
    return <DashboardSkeleton />
  }

  const statCards = [
    {
      label: "Total Uploads",
      value: stats.totalUploads,
      icon: FileSpreadsheet,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-100 dark:bg-blue-950/30",
    },
    {
      label: "Total Entries",
      value: stats.totalEntries,
      icon: Database,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-100 dark:bg-indigo-950/30",
    },
    {
      label: "Critical Cases",
      value: stats.criticalCount,
      icon: AlertTriangle,
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-100 dark:bg-red-950/30",
    },
    {
      label: "Volunteers",
      value: stats.totalVolunteers,
      icon: Users,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-100 dark:bg-emerald-950/30",
    },
  ]

  const axisTickStyle = { fontSize: 12, fill: "hsl(var(--muted-foreground))" }
  const gridStroke = "hsl(var(--border))"

  return (
    <div className="space-y-6">
      {/* Row 1 — Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card key={card.label} className="border border-border bg-card shadow-sm shadow-black/5 hover:shadow-md hover:border-border/80 transition-all duration-200 group">
            <CardHeader className="flex flex-row items-center justify-between pb-1">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {card.label}
              </CardTitle>
              <div className={`rounded-lg p-2.5 ${card.bg} transition-transform duration-200 group-hover:scale-110`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-extrabold tracking-tight tabular-nums ${card.label === "Critical Cases" ? "text-red-600 dark:text-red-400" : ""}`}>
                {card.value.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Row 2 — Severity Distribution & Entries by Region */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border border-border bg-card shadow-sm shadow-black/5 hover:shadow-md transition-shadow duration-200">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-base font-semibold">Severity Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.severityDistribution}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={55}
                    paddingAngle={3}
                    cornerRadius={4}
                  >
                    {stats.severityDistribution.map((entry) => (
                      <Cell
                        key={entry.level}
                        fill={SEVERITY_COLORS[entry.level] ?? "#a3a3a3"}
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value: string) => (
                      <span className="text-foreground text-sm">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card shadow-sm shadow-black/5 hover:shadow-md transition-shadow duration-200">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-base font-semibold">Entries by Region</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.regionData.slice(0, 8)}
                  layout="vertical"
                  margin={{ left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridStroke} />
                  <XAxis type="number" tick={axisTickStyle} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={100}
                    tick={axisTickStyle}
                  />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar
                    dataKey="count"
                    fill="#6366f1"
                    radius={[0, 4, 4, 0]}
                    barSize={18}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3 — Uploads Timeline & Needs Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border border-border bg-card shadow-sm shadow-black/5 hover:shadow-md transition-shadow duration-200">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-base font-semibold">Uploads Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.uploadsTimeline}>
                  <defs>
                    <linearGradient id="indigoGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="date" tick={axisTickStyle} />
                  <YAxis tick={axisTickStyle} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Area
                    type="monotone"
                    dataKey="entries"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="url(#indigoGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card shadow-sm shadow-black/5 hover:shadow-md transition-shadow duration-200">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-base font-semibold">Needs Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={stats.tagData}>
                  <PolarGrid stroke={gridStroke} />
                  <PolarAngleAxis dataKey="name" tick={axisTickStyle} />
                  <PolarRadiusAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <Radar
                    dataKey="count"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.35}
                  />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 4 — Recent Uploads Table */}
      <Card className="border border-border bg-card shadow-sm shadow-black/5 hover:shadow-md transition-shadow duration-200">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-lg font-semibold">Recent Uploads</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto scrollbar-thin">
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Title</TableHead>
                  <TableHead className="text-right">Entries</TableHead>
                  <TableHead className="text-right">Critical</TableHead>
                  <TableHead className="text-right">Avg Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentUploads.slice(0, 5).map((upload, idx) => (
                  <TableRow key={upload.id} className={idx % 2 !== 0 ? "bg-muted/20" : ""}>
                    <TableCell className="font-semibold text-foreground">{upload.title}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {upload.totalEntries.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      <span className={upload.criticalCount > 0 ? "text-red-600 dark:text-red-400" : ""}>
                        {upload.criticalCount.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {upload.avgSeverity !== null
                        ? upload.avgSeverity.toFixed(1)
                        : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={statusVariant(upload.status)}
                        className={statusColor(upload.status)}
                      >
                        {upload.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs font-medium">
                      {new Date(upload.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowDownUp,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Eye,
  FileSpreadsheet,
  Filter,
  Pencil,
  Plus,
  ScrollText,
  Search,
  Trash2,
  User,
  X,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  action: string;
  entityType: string;
  entityId: string;
  entityTitle: string | null;
  details: Record<string, unknown>;
  ipAddress: string | null;
  createdAt: string;
}

interface AuditLogsResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  totalPages: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const ACTION_OPTIONS = ["All", "CREATE", "READ", "UPDATE", "DELETE"] as const;
const ENTITY_OPTIONS = ["All", "Upload", "User", "SurveyEntry"] as const;

const actionConfig: Record<
  string,
  { icon: typeof Plus; color: string; bg: string; border: string }
> = {
  CREATE: {
    icon: Plus,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  READ: {
    icon: Eye,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  UPDATE: {
    icon: Pencil,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  DELETE: {
    icon: Trash2,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
  },
};

const entityIcons: Record<string, typeof FileSpreadsheet> = {
  Upload: FileSpreadsheet,
  User: User,
  SurveyEntry: ScrollText,
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

/* ------------------------------------------------------------------ */
/*  Skeletons                                                          */
/* ------------------------------------------------------------------ */

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="flex gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-36" />
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Diff Viewer                                                        */
/* ------------------------------------------------------------------ */

function DiffViewer({ details }: { details: Record<string, unknown> }) {
  if (!details || Object.keys(details).length === 0) {
    return (
      <span className="text-[12px] text-muted-foreground italic">
        No details recorded
      </span>
    );
  }

  // Check if this is a diff-style changes object (has old/new keys)
  const isDiff = Object.values(details).some(
    (v) =>
      v !== null &&
      typeof v === "object" &&
      "old" in (v as Record<string, unknown>) &&
      "new" in (v as Record<string, unknown>),
  );

  if (isDiff) {
    return (
      <div className="space-y-2">
        {Object.entries(details).map(([key, val]) => {
          const change = val as { old: unknown; new: unknown };
          return (
            <div
              key={key}
              className="rounded-lg border border-border bg-muted/30 p-3"
            >
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                {key}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md bg-red-500/5 border border-red-500/15 px-3 py-2">
                  <p className="text-[10px] font-semibold text-red-500 uppercase tracking-wider mb-0.5">
                    Old Value
                  </p>
                  <p className="text-[12px] text-foreground font-mono break-all">
                    {String(change.old ?? "—")}
                  </p>
                </div>
                <div className="rounded-md bg-emerald-500/5 border border-emerald-500/15 px-3 py-2">
                  <p className="text-[10px] font-semibold text-emerald-500 uppercase tracking-wider mb-0.5">
                    New Value
                  </p>
                  <p className="text-[12px] text-foreground font-mono break-all">
                    {String(change.new ?? "—")}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Regular details display
  return (
    <div className="grid grid-cols-2 gap-2">
      {Object.entries(details).map(([key, val]) => (
        <div key={key} className="rounded-md bg-muted/30 px-3 py-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
            {key}
          </p>
          <p className="text-[12px] text-foreground font-mono truncate">
            {Array.isArray(val) ? val.join(", ") : String(val ?? "—")}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function AuditLogsPage() {
  const [data, setData] = useState<AuditLogsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filters
  const [action, setAction] = useState<string>("All");
  const [entityType, setEntityType] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [page, setPage] = useState(1);
  const limit = 20;

  const [debouncedFilters, setDebouncedFilters] = useState({
    action,
    entityType,
    search,
    from,
    to,
    sortOrder,
  });

  const isFirstRender = React.useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const handler = setTimeout(() => {
      setDebouncedFilters({ action, entityType, search, from, to, sortOrder });
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [action, entityType, search, from, to, sortOrder]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    params.set("sortOrder", debouncedFilters.sortOrder);
    if (debouncedFilters.action !== "All") params.set("action", debouncedFilters.action);
    if (debouncedFilters.entityType !== "All") params.set("entityType", debouncedFilters.entityType);
    if (debouncedFilters.search.trim()) params.set("search", debouncedFilters.search.trim());
    if (debouncedFilters.from) params.set("from", debouncedFilters.from);
    if (debouncedFilters.to) params.set("to", debouncedFilters.to);

    try {
      const res = await fetch(`/api/audit-logs?${params.toString()}`);
      if (res.ok) {
        const json: AuditLogsResponse = await res.json();
        setData(json);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [page, debouncedFilters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const clearFilters = () => {
    setAction("All");
    setEntityType("All");
    setSearch("");
    setFrom("");
    setTo("");
    setSortOrder("desc");
    setDebouncedFilters({
      action: "All",
      entityType: "All",
      search: "",
      from: "",
      to: "",
      sortOrder: "desc",
    });
    setPage(1);
  };

  const hasFilters =
    action !== "All" ||
    entityType !== "All" ||
    search.trim() !== "" ||
    from !== "" ||
    to !== "";

  if (loading && !data) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
            <ScrollText className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Audit Logs</h1>
            <p className="text-xs text-muted-foreground">
              Track all system activity and data changes
            </p>
          </div>
        </div>
        {data && (
          <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-bold tabular-nums text-muted-foreground">
            {data.total.toLocaleString()} total
          </span>
        )}
      </div>

      {/* ============================================================ */}
      {/*  Filter Bar                                                   */}
      {/* ============================================================ */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/50" />
              <Input
                placeholder="Search by entity title…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 bg-muted/30 border-transparent focus:border-primary/40"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Action Filter */}
          <div className="w-[140px]">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
              Action
            </label>
            <Select value={action} onValueChange={(v) => setAction(v ?? "All")}>
              <SelectTrigger className="h-9 bg-muted/30 border-transparent">
                <Filter className="size-3.5 mr-1.5 text-muted-foreground/50" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTION_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt === "All" ? "All Actions" : opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Entity Type Filter */}
          <div className="w-[160px]">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
              Entity Type
            </label>
            <Select value={entityType} onValueChange={(v) => setEntityType(v ?? "All")}>
              <SelectTrigger className="h-9 bg-muted/30 border-transparent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ENTITY_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt === "All" ? "All Types" : opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date From */}
          <div className="w-[150px]">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
              From
            </label>
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/50" />
              <Input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="pl-9 h-9 bg-muted/30 border-transparent focus:border-primary/40"
              />
            </div>
          </div>

          {/* Date To */}
          <div className="w-[150px]">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
              To
            </label>
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/50" />
              <Input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="pl-9 h-9 bg-muted/30 border-transparent focus:border-primary/40"
              />
            </div>
          </div>

          {/* Sort Toggle */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
              Sort
            </label>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 bg-muted/30 border-transparent hover:bg-muted/60"
              onClick={() =>
                setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))
              }
            >
              <ArrowDownUp className="size-3.5" />
              {sortOrder === "desc" ? "Newest" : "Oldest"}
            </Button>
          </div>

          {/* Clear Filters */}
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 text-muted-foreground hover:text-foreground"
              onClick={clearFilters}
            >
              <X className="size-3.5 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/*  Logs Table                                                   */}
      {/* ============================================================ */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : !data || data.logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-20 text-center">
          <ScrollText className="size-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold text-foreground">
            No audit logs found
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {hasFilters
              ? "Try adjusting your filters"
              : "Activity will appear here as users interact with the system"}
          </p>
          {hasFilters && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={clearFilters}
            >
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="w-[180px] text-[11px] font-bold uppercase tracking-wider">
                  Timestamp
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider">
                  User
                </TableHead>
                <TableHead className="w-[120px] text-[11px] font-bold uppercase tracking-wider">
                  Action
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider">
                  Entity
                </TableHead>
                <TableHead className="w-[60px] text-[11px] font-bold uppercase tracking-wider text-center">
                  Details
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.logs.map((log) => {
                const cfg = actionConfig[log.action] ?? actionConfig["READ"];
                const ActionIcon = cfg.icon;
                const EntityIcon = entityIcons[log.entityType] ?? ScrollText;
                const isExpanded = expandedId === log.id;
                const hasDetails =
                  log.details && Object.keys(log.details).length > 0;

                return (
                  <React.Fragment key={log.id}>
                    <TableRow
                      className={`group transition-colors ${
                        isExpanded
                          ? "bg-muted/40"
                          : "hover:bg-muted/20"
                      }`}
                    >
                      {/* Timestamp */}
                      <TableCell>
                        <div>
                          <p className="text-[13px] font-medium text-foreground tabular-nums">
                            {formatDate(log.createdAt)}
                          </p>
                          <p className="text-[11px] text-muted-foreground tabular-nums">
                            {formatTime(log.createdAt)}{" "}
                            <span className="text-muted-foreground/50">
                              · {timeAgo(log.createdAt)}
                            </span>
                          </p>
                        </div>
                      </TableCell>

                      {/* User */}
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-[12px] font-bold text-primary shrink-0">
                            {log.userName?.charAt(0).toUpperCase() ?? "?"}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-foreground truncate">
                              {log.userName}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {log.userEmail}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Action Badge */}
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold border ${cfg.bg} ${cfg.color} ${cfg.border}`}
                        >
                          <ActionIcon className="size-3" />
                          {log.action}
                        </span>
                      </TableCell>

                      {/* Entity */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex size-7 items-center justify-center rounded-lg bg-muted/60 shrink-0">
                            <EntityIcon className="size-3.5 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[12px] font-semibold text-foreground truncate">
                              {log.entityTitle ?? log.entityId}
                            </p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                              {log.entityType}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Expand */}
                      <TableCell className="text-center">
                        {hasDetails ? (
                          <button
                            onClick={() =>
                              setExpandedId(isExpanded ? null : log.id)
                            }
                            className="inline-flex size-8 items-center justify-center rounded-lg hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground"
                          >
                            {isExpanded ? (
                              <ChevronUp className="size-4" />
                            ) : (
                              <ChevronDown className="size-4" />
                            )}
                          </button>
                        ) : (
                          <span className="text-[11px] text-muted-foreground/40">
                            —
                          </span>
                        )}
                      </TableCell>
                    </TableRow>

                    {/* Expanded Details Row */}
                    {isExpanded && hasDetails && (
                      <TableRow key={`${log.id}-details`} className="bg-muted/20">
                        <TableCell colSpan={5} className="py-4 px-6">
                          <div className="max-w-3xl">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
                              {log.action === "UPDATE"
                                ? "Changes Made"
                                : "Details"}
                            </p>
                            <DiffViewer details={log.details} />
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ============================================================ */}
      {/*  Pagination                                                   */}
      {/* ============================================================ */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-[12px] text-muted-foreground">
            Showing{" "}
            <span className="font-bold text-foreground tabular-nums">
              {(data.page - 1) * limit + 1}
            </span>
            –
            <span className="font-bold text-foreground tabular-nums">
              {Math.min(data.page * limit, data.total)}
            </span>{" "}
            of{" "}
            <span className="font-bold text-foreground tabular-nums">
              {data.total.toLocaleString()}
            </span>
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="size-4" />
            </Button>
            {Array.from(
              { length: Math.min(data.totalPages, 5) },
              (_, i) => {
                let pageNum: number;
                if (data.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= data.totalPages - 2) {
                  pageNum = data.totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(pageNum)}
                    className="h-8 w-8 p-0 text-[12px] font-bold"
                  >
                    {pageNum}
                  </Button>
                );
              },
            )}
            <Button
              variant="outline"
              size="sm"
              disabled={page >= (data?.totalPages ?? 1)}
              onClick={() =>
                setPage((p) => Math.min(data?.totalPages ?? 1, p + 1))
              }
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

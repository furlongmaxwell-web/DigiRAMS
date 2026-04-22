"use client";

import {
  AlertTriangle,
  ArrowLeft,
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  ChevronUp,
  Clock,
  Columns3,
  FileSpreadsheet,
  Filter,
  RefreshCw,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface UploadMeta {
  id: string;
  title: string;
  totalEntries: number;
  processedEntries: number;
  status: string;
  headers: { key: string; label: string; type: string }[];
  aiSummary: string | null;
  aiTags: string[];
  avgSeverity: number | null;
  criticalCount: number;
  createdAt: string;
  uploadedByName: string;
}

type SeverityLevel = "MINIMAL" | "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
type EntryStatus = "PENDING" | "RESOLVED" | "NO_ACTION_NEEDED";

interface EntryData {
  id: string;
  rawData: Record<string, string>;
  severityLevel: SeverityLevel | null;
  severityReason: string | null;
  status: EntryStatus;
}

interface EntriesResponse {
  entries: EntryData[];
  total: number;
  page: number;
  totalPages: number;
}

const LIMIT = 50;

const DEFAULT_VISIBLE_KEYS = new Set([
  "survey_id",
  "country",
  "survey_date",
  "age",
  "gender",
  "state_province",
  "did_you_receive_aid",
  "did_you_need_aid",
]);

const SEVERITY_LEVELS: SeverityLevel[] = [
  "MINIMAL",
  "LOW",
  "MODERATE",
  "HIGH",
  "CRITICAL",
];

const severityConfig: Record<
  SeverityLevel,
  {
    dot: string;
    bg: string;
    text: string;
    label: string;
    badge: string;
    rowTint: string;
    numeric: number;
  }
> = {
  MINIMAL: {
    dot: "bg-emerald-500",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-400",
    badge:
      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 ring-emerald-500/30",
    rowTint: "",
    label: "Minimal",
    numeric: 1,
  },
  LOW: {
    dot: "bg-lime-500",
    bg: "bg-lime-100 dark:bg-lime-900/30",
    text: "text-lime-700 dark:text-lime-400",
    badge: "bg-lime-500/15 text-lime-700 dark:text-lime-400 ring-lime-500/30",
    rowTint: "",
    label: "Low",
    numeric: 2,
  },
  MODERATE: {
    dot: "bg-amber-500",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-400",
    badge:
      "bg-amber-500/15 text-amber-700 dark:text-amber-400 ring-amber-500/30",
    rowTint: "",
    label: "Moderate",
    numeric: 3,
  },
  HIGH: {
    dot: "bg-orange-500",
    bg: "bg-orange-100 dark:bg-orange-900/30",
    text: "text-orange-700 dark:text-orange-400",
    badge:
      "bg-orange-500/20 text-orange-700 dark:text-orange-300 ring-orange-500/40",
    rowTint: "bg-orange-50/50 dark:bg-orange-950/20",
    label: "High",
    numeric: 4,
  },
  CRITICAL: {
    dot: "bg-red-500",
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-400",
    badge: "bg-red-500/20 text-red-700 dark:text-red-300 ring-red-500/40",
    rowTint: "bg-red-50/60 dark:bg-red-950/25",
    label: "Critical",
    numeric: 5,
  },
};

const statusConfig: Record<
  EntryStatus,
  { className: string; label: string; filterLabel: string }
> = {
  PENDING: {
    className:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    label: "Pending",
    filterLabel: "Pending",
  },
  RESOLVED: {
    className:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    label: "Resolved",
    filterLabel: "Resolved",
  },
  NO_ACTION_NEEDED: {
    className:
      "bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400",
    label: "No Action",
    filterLabel: "No Action Needed",
  },
};

type SortField = "severity" | "status";
type SortDir = "asc" | "desc";

function UploadStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "analyzing":
      return (
        <Badge variant="secondary" className="gap-1">
          <RefreshCw className="size-3 animate-spin" />
          Analyzing
        </Badge>
      );
    case "completed":
      return (
        <Badge
          variant="secondary"
          className="gap-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
        >
          <CheckCircle2 className="size-3" />
          Completed
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="size-3" />
          Failed
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="size-3" />
          {status}
        </Badge>
      );
  }
}

function SortIcon({
  field,
  activeField,
  dir,
}: {
  field: SortField;
  activeField: SortField | null;
  dir: SortDir;
}) {
  if (activeField !== field)
    return <ChevronsUpDown className="size-3.5 text-muted-foreground/60" />;
  if (dir === "asc") return <ChevronUp className="size-3.5" />;
  return <ChevronDown className="size-3.5" />;
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <Card className="border border-border hover:shadow-md transition-all duration-200 group">
      <CardContent className="px-4 py-4">
        <p
          className={`text-2xl font-extrabold tabular-nums tracking-tight ${accent ?? "text-foreground"}`}
        >
          {value}
        </p>
        <p className="text-xs font-medium text-muted-foreground mt-0.5">
          {label}
        </p>
      </CardContent>
    </Card>
  );
}

export default function UploadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [upload, setUpload] = useState<UploadMeta | null>(null);
  const [entries, setEntries] = useState<EntriesResponse | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [entriesLoading, setEntriesLoading] = useState(true);
  const entriesFetchId = useRef(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [severityFilters, setSeverityFilters] = useState<Set<SeverityLevel>>(
    new Set(),
  );
  const [statusFilters, setStatusFilters] = useState<Set<EntryStatus>>(
    new Set(),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(DEFAULT_VISIBLE_KEYS),
  );
  const [selectedEntry, setSelectedEntry] = useState<EntryData | null>(null);
  const [reasonLoading, setReasonLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const res = await fetch(`/api/uploads/${id}`);
      if (cancelled) return;
      if (res.ok) {
        const data: UploadMeta = await res.json();
        setUpload(data);
        setLoading(false);

        if (data.status === "analyzing") {
          pollRef.current = setInterval(async () => {
            const pollRes = await fetch(`/api/uploads/${id}`);
            if (!pollRes.ok) return;
            const updated: UploadMeta = await pollRes.json();
            setUpload(updated);
            if (updated.status !== "analyzing") {
              if (pollRef.current) clearInterval(pollRef.current);
              pollRef.current = null;
            }
          }, 3000);
        }
      } else {
        setLoading(false);
      }
    }

    init();
    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [id]);

  useEffect(() => {
    const currentFetchId = ++entriesFetchId.current;
    const controller = new AbortController();
    fetch(`/api/uploads/${id}/entries?page=${page}&limit=${LIMIT}`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data: EntriesResponse) => {
        if (entriesFetchId.current === currentFetchId) {
          setEntries(data);
          setEntriesLoading(false);
        }
      })
      .catch(() => {
        if (entriesFetchId.current === currentFetchId) {
          setEntriesLoading(false);
        }
      });
    return () => {
      controller.abort();
    };
  }, [id, page]);

  const selectedEntryId = selectedEntry?.id;
  const selectedSeverity = selectedEntry?.severityLevel;
  const selectedReason = selectedEntry?.severityReason;

  useEffect(() => {
    if (
      !selectedEntryId ||
      selectedReason ||
      !selectedSeverity ||
      (selectedSeverity !== "HIGH" && selectedSeverity !== "CRITICAL")
    ) {
      return;
    }

    let cancelled = false;
    setReasonLoading(true);

    fetch(`/api/uploads/${id}/entries/${selectedEntryId}/reason`, {
      method: "POST",
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.reason) {
          setSelectedEntry((prev) =>
            prev ? { ...prev, severityReason: data.reason } : null,
          );
          setEntries((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              entries: prev.entries.map((e) =>
                e.id === selectedEntryId
                  ? { ...e, severityReason: data.reason }
                  : e,
              ),
            };
          });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setReasonLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedEntryId, selectedReason, selectedSeverity, id]);

  const toggleSeverity = (level: SeverityLevel) => {
    setSeverityFilters((prev) => {
      const next = new Set(prev);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return next;
    });
  };

  const toggleStatus = (status: EntryStatus) => {
    setStatusFilters((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDir === "asc") setSortDir("desc");
      else {
        setSortField(null);
        setSortDir("asc");
      }
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const toggleColumn = (key: string) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const showAllColumns = () => {
    if (upload) setVisibleColumns(new Set(upload.headers.map((h) => h.key)));
  };

  const resetColumns = () => {
    setVisibleColumns(new Set(DEFAULT_VISIBLE_KEYS));
  };

  const visibleHeaders = useMemo(() => {
    if (!upload) return [];
    return upload.headers.filter((h) => visibleColumns.has(h.key));
  }, [upload, visibleColumns]);

  const activeFilterCount =
    severityFilters.size + statusFilters.size + (searchQuery ? 1 : 0);

  const clearFilters = () => {
    setSeverityFilters(new Set<SeverityLevel>());
    setStatusFilters(new Set<EntryStatus>());
    setSearchQuery("");
  };

  const filteredAndSorted = useMemo(() => {
    if (!entries) return [];

    let result = entries.entries;

    if (severityFilters.size > 0) {
      result = result.filter(
        (e) => e.severityLevel !== null && severityFilters.has(e.severityLevel),
      );
    }

    if (statusFilters.size > 0) {
      result = result.filter((e) => statusFilters.has(e.status));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((e) =>
        Object.values(e.rawData).some((v) => v.toLowerCase().includes(q)),
      );
    }

    if (sortField) {
      result = [...result].sort((a, b) => {
        let cmp = 0;
        if (sortField === "severity") {
          const aNum = a.severityLevel
            ? severityConfig[a.severityLevel].numeric
            : 0;
          const bNum = b.severityLevel
            ? severityConfig[b.severityLevel].numeric
            : 0;
          cmp = aNum - bNum;
        } else if (sortField === "status") {
          cmp = a.status.localeCompare(b.status);
        }
        return sortDir === "asc" ? cmp : -cmp;
      });
    }

    return result;
  }, [
    entries,
    severityFilters,
    statusFilters,
    searchQuery,
    sortField,
    sortDir,
  ]);

  const stats = useMemo(() => {
    if (!entries)
      return { total: 0, critical: 0, pending: 0, resolved: 0, noAction: 0 };
    const all = entries.entries;
    return {
      total: entries.total,
      critical: all.filter(
        (e) => e.severityLevel === "HIGH" || e.severityLevel === "CRITICAL",
      ).length,
      pending: all.filter((e) => e.status === "PENDING").length,
      resolved: all.filter((e) => e.status === "RESOLVED").length,
      noAction: all.filter((e) => e.status === "NO_ACTION_NEEDED").length,
    };
  }, [entries]);

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-4 w-48" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[72px] rounded-lg" />
          ))}
        </div>
        <TableSkeleton />
      </div>
    );
  }

  if (!upload) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12">
        <AlertTriangle className="size-12 text-muted-foreground" />
        <p className="text-lg text-muted-foreground">Upload not found</p>
        <Button variant="outline" render={<Link href="/dashboard/uploads" />}>
          <ArrowLeft className="size-4" />
          Back to uploads
        </Button>
      </div>
    );
  }

  const progressPercent =
    upload.totalEntries > 0
      ? Math.round((upload.processedEntries / upload.totalEntries) * 100)
      : 0;

  const startEntry = filteredAndSorted.length > 0 ? (page - 1) * LIMIT + 1 : 0;
  const endEntry = Math.min(page * LIMIT, entries?.total ?? 0);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            render={<Link href="/dashboard/uploads" />}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {upload.title}
            </h1>
            <UploadStatusBadge status={upload.status} />
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          Uploaded by{" "}
          <span className="font-medium text-foreground">
            {upload.uploadedByName}
          </span>{" "}
          on{" "}
          {new Date(upload.createdAt).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>

        {upload.status === "analyzing" && (
          <div className="max-w-md space-y-1.5">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Processing {upload.processedEntries} of {upload.totalEntries}{" "}
                entries
              </span>
              <span className="font-medium text-foreground">
                {progressPercent}%
              </span>
            </div>
            <Progress value={progressPercent} />
          </div>
        )}
      </div>

      {/* AI Summary */}
      {upload.aiSummary && (
        <Card className="border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-300">
              <Brain className="size-5" />
              AI Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-blue-800 dark:text-blue-300/90">
              {upload.aiSummary}
            </p>
          </CardContent>
        </Card>
      )}

      {/* AI Tags */}
      {upload.aiTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {upload.aiTags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatCard label="Total Entries" value={stats.total} />
        <StatCard
          label="Critical (4-5)"
          value={stats.critical}
          accent="text-red-600 dark:text-red-400"
        />
        <StatCard
          label="Pending"
          value={stats.pending}
          accent="text-yellow-600 dark:text-yellow-400"
        />
        <StatCard
          label="Resolved"
          value={stats.resolved}
          accent="text-green-600 dark:text-green-400"
        />
        <StatCard label="No Action" value={stats.noAction} />
      </div>

      {/* Filter Bar */}
      <Card className="border border-border shadow-sm">
        <CardContent className="flex flex-wrap items-center gap-4 px-4 py-3.5">
          {/* Severity Filters */}
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Severity
            </span>
            <div className="flex gap-1">
              {SEVERITY_LEVELS.map((level) => {
                const active = severityFilters.has(level);
                const sev = severityConfig[level];
                return (
                  <button
                    key={level}
                    onClick={() => toggleSeverity(level)}
                    className={`cursor-pointer inline-flex h-8 items-center justify-center rounded-lg px-2.5 text-[11px] font-bold transition-all duration-150 ${
                      active
                        ? `${sev.bg} ${sev.text} ring-2 ring-current/25 shadow-sm`
                        : "bg-muted/50 text-muted-foreground hover:bg-muted hover:scale-105"
                    }`}
                  >
                    {sev.numeric}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-6 w-px bg-border" />

          {/* Status Filters */}
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Status
            </span>
            <div className="flex gap-1.5">
              {(Object.keys(statusConfig) as EntryStatus[]).map((key) => {
                const cfg = statusConfig[key];
                const active = statusFilters.has(key);
                return (
                  <button
                    key={key}
                    onClick={() => toggleStatus(key)}
                    className={`cursor-pointer inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
                      active
                        ? `${cfg.className} ring-1 ring-current/20 shadow-sm`
                        : "bg-muted/50 text-muted-foreground hover:bg-muted hover:scale-[1.02]"
                    }`}
                  >
                    {cfg.filterLabel}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-6 w-px bg-border" />

          {/* Search */}
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          <div className="h-6 w-px bg-border" />

          {/* Column Visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm" className="gap-1.5" />
              }
            >
              <Columns3 className="size-3.5" />
              Columns
              <Badge
                variant="secondary"
                className="ml-0.5 px-1.5 font-bold text-[10px]"
              >
                {visibleColumns.size}/{upload.headers.length}
              </Badge>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="max-h-80 w-64 overflow-y-auto"
              align="end"
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <div className="flex gap-1.5 px-1.5 pb-1.5">
                <button
                  onClick={showAllColumns}
                  className="cursor-pointer flex-1 rounded-md bg-muted/60 px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  Show all
                </button>
                <button
                  onClick={resetColumns}
                  className="cursor-pointer flex-1 rounded-md bg-muted/60 px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  Reset
                </button>
              </div>
              <DropdownMenuSeparator />
              {upload.headers.map((header) => (
                <DropdownMenuCheckboxItem
                  key={header.key}
                  checked={visibleColumns.has(header.key)}
                  onSelect={(e) => {
                    e.preventDefault();
                    toggleColumn(header.key);
                  }}
                >
                  <span className="truncate">{header.label}</span>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Clear Filters */}
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="size-3.5" />
              Clear{" "}
              <Badge variant="secondary" className="ml-0.5 px-1.5 font-bold">
                {activeFilterCount}
              </Badge>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border border-border shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-0">
          {entriesLoading ? (
            <div className="p-6">
              <TableSkeleton />
            </div>
          ) : entries && entries.entries.length > 0 ? (
            <>
              <div className="overflow-x-auto scrollbar-thin">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="sticky left-0 z-10 w-[110px] bg-muted/50 dark:bg-muted/40">
                        <button
                          onClick={() => toggleSort("severity")}
                          className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-colors hover:text-foreground"
                        >
                          Severity
                          <SortIcon
                            field="severity"
                            activeField={sortField}
                            dir={sortDir}
                          />
                        </button>
                      </TableHead>
                      <TableHead className="w-[130px]">
                        <button
                          onClick={() => toggleSort("status")}
                          className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-colors hover:text-foreground"
                        >
                          Status
                          <SortIcon
                            field="status"
                            activeField={sortField}
                            dir={sortDir}
                          />
                        </button>
                      </TableHead>
                      {visibleHeaders.map((header) => (
                        <TableHead key={header.key}>{header.label}</TableHead>
                      ))}
                      <TableHead className="w-[50px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSorted.length > 0 ? (
                      filteredAndSorted.map((entry, idx) => {
                        const sev = entry.severityLevel
                          ? severityConfig[entry.severityLevel]
                          : null;
                        const stat = statusConfig[entry.status];
                        const isHighSeverity =
                          entry.severityLevel === "HIGH" ||
                          entry.severityLevel === "CRITICAL";
                        const rowBg = sev?.rowTint
                          ? sev.rowTint
                          : idx % 2 !== 0
                            ? "bg-muted/20"
                            : "";

                        return (
                          <TableRow
                            key={entry.id}
                            onClick={() => setSelectedEntry(entry)}
                            className={`cursor-pointer transition-colors duration-150 hover:bg-accent/50 ${rowBg}`}
                          >
                            <TableCell className="sticky left-0 z-10 bg-inherit">
                              {sev ? (
                                <span
                                  className={`inline-flex items-center gap-2 rounded-md px-2.5 py-1 text-xs font-bold ring-1 ${sev.badge}`}
                                >
                                  <span
                                    className={`inline-block size-2 rounded-full ${sev.dot} ${isHighSeverity ? "animate-pulse" : ""}`}
                                  />
                                  Level {sev.label}
                                  {isHighSeverity && (
                                    <ShieldAlert className="size-3" />
                                  )}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  —
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {stat ? (
                                <span
                                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${stat.className}`}
                                >
                                  {stat.label}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  {entry.status}
                                </span>
                              )}
                            </TableCell>
                            {visibleHeaders.map((header) => {
                              const val = entry.rawData[header.key] ?? "";
                              const display =
                                header.type === "boolean"
                                  ? val === "TRUE" ||
                                    val === "true" ||
                                    val === "1" ||
                                    val === "YES" ||
                                    val === "yes"
                                    ? "Yes"
                                    : val === "FALSE" ||
                                        val === "false" ||
                                        val === "0" ||
                                        val === "NO" ||
                                        val === "no"
                                      ? "No"
                                      : val
                                  : val;
                              return (
                                <TableCell
                                  key={header.key}
                                  className="max-w-[250px] truncate text-sm"
                                  title={String(val)}
                                >
                                  {display}
                                </TableCell>
                              );
                            })}
                            <TableCell className="text-muted-foreground">
                              <ChevronRight className="size-4" />
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={3 + visibleHeaders.length}
                          className="py-16 text-center"
                        >
                          <div className="flex flex-col items-center gap-3">
                            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
                              <Filter className="size-7 text-muted-foreground/50" />
                            </div>
                            <p className="text-sm font-medium text-muted-foreground">
                              No entries match your filters
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={clearFilters}
                            >
                              Clear filters
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/20 px-4 py-3.5">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="font-medium">
                    Showing{" "}
                    <span className="text-foreground tabular-nums">
                      {startEntry}–{endEntry}
                    </span>{" "}
                    of{" "}
                    <span className="text-foreground tabular-nums">
                      {entries.total}
                    </span>{" "}
                    entries
                  </span>
                  {activeFilterCount > 0 && (
                    <>
                      <span className="text-border">·</span>
                      <span className="inline-flex items-center gap-1 font-medium">
                        <Filter className="size-3" />
                        Filtered:{" "}
                        <span className="text-foreground tabular-nums">
                          {filteredAndSorted.length}
                        </span>{" "}
                        of{" "}
                        <span className="tabular-nums">
                          {entries.entries.length}
                        </span>
                      </span>
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= (entries?.totalPages ?? 1)}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
                <FileSpreadsheet className="size-7 text-muted-foreground/50" />
              </div>
              <p className="font-medium text-muted-foreground">
                No entries found
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Entry Detail Sheet */}
      <Sheet
        open={!!selectedEntry}
        onOpenChange={(open) => {
          if (!open) setSelectedEntry(null);
        }}
      >
        <SheetContent
          side="right"
          className="sm:max-w-lg w-full overflow-y-auto"
        >
          {selectedEntry &&
            (() => {
              const sev = selectedEntry.severityLevel
                ? severityConfig[selectedEntry.severityLevel]
                : null;
              const stat = statusConfig[selectedEntry.status];
              const isHighSeverity =
                selectedEntry.severityLevel === "HIGH" ||
                selectedEntry.severityLevel === "CRITICAL";

              return (
                <>
                  <SheetHeader className="pb-2">
                    <SheetTitle className="flex items-center gap-3">
                      Entry Details
                      {sev && (
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold ring-1 ${sev.badge}`}
                        >
                          <span
                            className={`inline-block size-2 rounded-full ${sev.dot}`}
                          />
                          Level {sev.label}
                          {isHighSeverity && <ShieldAlert className="size-3" />}
                        </span>
                      )}
                    </SheetTitle>
                    <SheetDescription>
                      {stat && (
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${stat.className}`}
                        >
                          {stat.label}
                        </span>
                      )}
                    </SheetDescription>
                  </SheetHeader>

                  {isHighSeverity && (
                    <div className="mx-4 space-y-2.5">
                      <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-800/50 dark:bg-red-950/30 overflow-hidden">
                        <div className="flex items-center gap-2 px-3 py-2 border-b border-red-200/60 dark:border-red-800/30">
                          <ShieldAlert className="size-4 shrink-0 text-red-600 dark:text-red-400" />
                          <span className="text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-400">
                            Why this severity?
                          </span>
                        </div>
                        <div className="px-3 py-2.5">
                          {reasonLoading ? (
                            <div className="flex items-center gap-2 text-sm text-red-700/70 dark:text-red-400/70">
                              <RefreshCw className="size-3.5 animate-spin" />
                              Analyzing entry data...
                            </div>
                          ) : selectedEntry.severityReason ? (
                            <p className="text-sm leading-relaxed text-red-800 dark:text-red-300">
                              {selectedEntry.severityReason}
                            </p>
                          ) : (
                            <p className="text-sm text-red-700/60 dark:text-red-400/60 italic">
                              Reason not available — re-analyze this upload to
                              generate reasons.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {!isHighSeverity && selectedEntry.severityReason && (
                    <div className="mx-4">
                      <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-950/30 px-3 py-2.5">
                        <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-1">
                          AI Assessment
                        </p>
                        <p className="text-sm leading-relaxed text-amber-800 dark:text-amber-300">
                          {selectedEntry.severityReason}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1 px-4 pb-6">
                    {upload.headers.map((header) => {
                      const val = selectedEntry.rawData[header.key] ?? "";
                      const display =
                        header.type === "boolean"
                          ? val === "TRUE" ||
                            val === "true" ||
                            val === "1" ||
                            val === "YES" ||
                            val === "yes"
                            ? "Yes"
                            : val === "FALSE" ||
                                val === "false" ||
                                val === "0" ||
                                val === "NO" ||
                                val === "no"
                              ? "No"
                              : val || "—"
                          : val || "—";

                      const isBoolYes =
                        header.type === "boolean" && display === "Yes";
                      const isBoolNo =
                        header.type === "boolean" && display === "No";

                      return (
                        <div
                          key={header.key}
                          className="flex items-start justify-between gap-4 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50"
                        >
                          <span className="text-[13px] font-medium text-muted-foreground leading-snug min-w-0 shrink-0 max-w-[55%]">
                            {header.label}
                          </span>
                          <span
                            className={`text-[13px] text-right leading-snug wrap-break-word min-w-0 ${
                              isBoolYes
                                ? "font-semibold text-emerald-600 dark:text-emerald-400"
                                : isBoolNo
                                  ? "text-muted-foreground"
                                  : "font-medium text-foreground"
                            }`}
                          >
                            {display}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()}
        </SheetContent>
      </Sheet>
    </div>
  );
}

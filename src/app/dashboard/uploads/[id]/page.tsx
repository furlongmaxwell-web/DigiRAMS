"use client";

import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpDown,
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Columns3,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Filter,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { Button } from "@/components/ui/button";
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

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

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

interface ColumnFilter {
  id: string;
  columnKey: string;
  operator: "contains" | "equals" | "gt" | "lt" | "gte" | "lte" | "between";
  value: string;
  valueTo?: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

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
    bg: "bg-emerald-500/10",
    text: "text-emerald-500",
    badge:
      "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-emerald-500/30",
    rowTint: "",
    label: "Minimal",
    numeric: 1,
  },
  LOW: {
    dot: "bg-lime-500",
    bg: "bg-lime-500/10",
    text: "text-lime-500",
    badge: "bg-lime-500/15 text-lime-600 dark:text-lime-400 ring-lime-500/30",
    rowTint: "",
    label: "Low",
    numeric: 2,
  },
  MODERATE: {
    dot: "bg-amber-500",
    bg: "bg-amber-500/10",
    text: "text-amber-500",
    badge:
      "bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-amber-500/30",
    rowTint: "",
    label: "Moderate",
    numeric: 3,
  },
  HIGH: {
    dot: "bg-orange-500",
    bg: "bg-orange-500/10",
    text: "text-orange-500",
    badge:
      "bg-orange-500/20 text-orange-600 dark:text-orange-300 ring-orange-500/40",
    rowTint: "bg-orange-500/[0.04]",
    label: "High",
    numeric: 4,
  },
  CRITICAL: {
    dot: "bg-red-500",
    bg: "bg-red-500/10",
    text: "text-red-500",
    badge: "bg-red-500/20 text-red-600 dark:text-red-300 ring-red-500/40",
    rowTint: "bg-red-500/[0.06]",
    label: "Critical",
    numeric: 5,
  },
};

const statusConfig: Record<
  EntryStatus,
  { className: string; label: string; dot: string }
> = {
  PENDING: {
    className: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400",
    label: "Pending",
    dot: "bg-yellow-500",
  },
  RESOLVED: {
    className: "bg-green-500/15 text-green-600 dark:text-green-400",
    label: "Resolved",
    dot: "bg-green-500",
  },
  NO_ACTION_NEEDED: {
    className: "bg-zinc-500/15 text-zinc-500 dark:text-zinc-400",
    label: "No Action",
    dot: "bg-zinc-500",
  },
};

const TEXT_OPERATORS = [
  { value: "contains", label: "Contains" },
  { value: "equals", label: "Equals" },
] as const;

const NUMBER_OPERATORS = [
  { value: "equals", label: "=" },
  { value: "gt", label: ">" },
  { value: "lt", label: "<" },
  { value: "gte", label: ">=" },
  { value: "lte", label: "<=" },
  { value: "between", label: "Between" },
] as const;

type SortField = string;
type SortDir = "asc" | "desc";

/* ------------------------------------------------------------------ */
/*  Small sub-components                                               */
/* ------------------------------------------------------------------ */

function UploadStatusBadge({ status }: { status: string }) {
  const map: Record<
    string,
    { icon: typeof Clock; label: string; cls: string }
  > = {
    analyzing: {
      icon: RefreshCw,
      label: "Analyzing",
      cls: "bg-orange-500/15 text-orange-500",
    },
    completed: {
      icon: CheckCircle2,
      label: "Completed",
      cls: "bg-emerald-500/15 text-emerald-500",
    },
    done: {
      icon: CheckCircle2,
      label: "Done",
      cls: "bg-emerald-500/15 text-emerald-500",
    },
    failed: {
      icon: AlertTriangle,
      label: "Failed",
      cls: "bg-red-500/15 text-red-500",
    },
  };
  const cfg = map[status] ?? {
    icon: Clock,
    label: status,
    cls: "bg-muted text-muted-foreground",
  };
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${cfg.cls}`}
    >
      <Icon
        className={`size-3 ${status === "analyzing" ? "animate-spin" : ""}`}
      />
      {cfg.label}
    </span>
  );
}

function SortIndicator({
  field,
  activeField,
  dir,
}: {
  field: string;
  activeField: string | null;
  dir: SortDir;
}) {
  if (activeField !== field)
    return <ArrowUpDown className="size-3 text-muted-foreground/30" />;
  if (dir === "asc") return <ChevronUp className="size-3" />;
  return <ChevronDown className="size-3" />;
}

function formatBool(val: string): string | null {
  const v = val.toLowerCase();
  if (["true", "1", "yes", "y"].includes(v)) return "Yes";
  if (["false", "0", "no", "n"].includes(v)) return "No";
  return null;
}

let _filterId = 0;
function nextFilterId() {
  return `cf_${++_filterId}`;
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

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
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set());
  const [selectedEntry, setSelectedEntry] = useState<EntryData | null>(null);
  const [reasonLoading, setReasonLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [columnFilters, setColumnFilters] = useState<ColumnFilter[]>([]);
  const [entriesVersion, setEntriesVersion] = useState(0);

  /* ---------- data fetching ---------- */

  useEffect(() => {
    let cancelled = false;
    async function init() {
      const res = await fetch(`/api/uploads/${id}`);
      if (cancelled) return;
      if (res.ok) {
        const data: UploadMeta = await res.json();
        setUpload(data);
        setVisibleColumns(new Set(data.headers.map((h) => h.key)));
        setLoading(false);
        if (data.status === "analyzing") {
          pollRef.current = setInterval(async () => {
            const r = await fetch(`/api/uploads/${id}`);
            if (!r.ok) return;
            const u: UploadMeta = await r.json();
            setUpload(u);
            if (u.status !== "analyzing") {
              clearInterval(pollRef.current!);
              pollRef.current = null;
              setEntriesVersion((v) => v + 1);
            }
          }, 3000);
        }
      } else setLoading(false);
    }
    init();
    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [id]);

  useEffect(() => {
    const fetchId = ++entriesFetchId.current;
    const ctrl = new AbortController();
    setEntriesLoading(true);
    fetch(`/api/uploads/${id}/entries?page=${page}&limit=${LIMIT}`, {
      signal: ctrl.signal,
    })
      .then((r) => r.json())
      .then((d: EntriesResponse) => {
        if (entriesFetchId.current === fetchId) {
          setEntries(d);
          setEntriesLoading(false);
        }
      })
      .catch(() => {
        if (entriesFetchId.current === fetchId) setEntriesLoading(false);
      });
    return () => ctrl.abort();
  }, [id, page, entriesVersion]);

  const selectedEntryId = selectedEntry?.id;
  const selectedSeverity = selectedEntry?.severityLevel;
  const selectedReason = selectedEntry?.severityReason;

  useEffect(() => {
    if (
      !selectedEntryId ||
      selectedReason ||
      !selectedSeverity ||
      (selectedSeverity !== "HIGH" && selectedSeverity !== "CRITICAL")
    )
      return;
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

  /* ---------- filter/sort helpers ---------- */

  const toggleSeverity = (level: SeverityLevel) => {
    setSeverityFilters((prev) => {
      const n = new Set(prev);
      n.has(level) ? n.delete(level) : n.add(level);
      return n;
    });
  };
  const toggleStatus = (status: EntryStatus) => {
    setStatusFilters((prev) => {
      const n = new Set(prev);
      n.has(status) ? n.delete(status) : n.add(status);
      return n;
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
  const toggleColumn = useCallback((key: string) => {
    setVisibleColumns((prev) => {
      const n = new Set(prev);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });
  }, []);
  const showAllColumns = () => {
    if (upload) setVisibleColumns(new Set(upload.headers.map((h) => h.key)));
  };
  const resetColumns = () => setVisibleColumns(new Set(DEFAULT_VISIBLE_KEYS));

  const addColumnFilter = () => {
    if (!upload || upload.headers.length === 0) return;
    setColumnFilters((prev) => [
      ...prev,
      {
        id: nextFilterId(),
        columnKey: upload.headers[0].key,
        operator: "contains",
        value: "",
      },
    ]);
  };
  const updateColumnFilter = (
    filterId: string,
    updates: Partial<ColumnFilter>,
  ) => {
    setColumnFilters((prev) =>
      prev.map((f) => (f.id === filterId ? { ...f, ...updates } : f)),
    );
  };
  const removeColumnFilter = (filterId: string) => {
    setColumnFilters((prev) => prev.filter((f) => f.id !== filterId));
  };

  const visibleHeaders = useMemo(
    () =>
      upload ? upload.headers.filter((h) => visibleColumns.has(h.key)) : [],
    [upload, visibleColumns],
  );
  const activeFilterCount =
    severityFilters.size +
    statusFilters.size +
    (searchQuery ? 1 : 0) +
    columnFilters.filter((f) => f.value.trim()).length;
  const clearFilters = () => {
    setSeverityFilters(new Set());
    setStatusFilters(new Set());
    setSearchQuery("");
    setColumnFilters([]);
  };

  const applyColumnFilter = useCallback(
    (entry: EntryData, filter: ColumnFilter): boolean => {
      const rawVal = entry.rawData[filter.columnKey] ?? "";
      const val = rawVal.toLowerCase();
      const filterVal = filter.value.trim().toLowerCase();
      if (!filterVal) return true;

      switch (filter.operator) {
        case "contains":
          return val.includes(filterVal);
        case "equals":
          return val === filterVal;
        case "gt":
          return parseFloat(rawVal) > parseFloat(filter.value);
        case "lt":
          return parseFloat(rawVal) < parseFloat(filter.value);
        case "gte":
          return parseFloat(rawVal) >= parseFloat(filter.value);
        case "lte":
          return parseFloat(rawVal) <= parseFloat(filter.value);
        case "between": {
          const num = parseFloat(rawVal);
          const lo = parseFloat(filter.value);
          const hi = parseFloat(filter.valueTo ?? "");
          return (
            !isNaN(num) && !isNaN(lo) && !isNaN(hi) && num >= lo && num <= hi
          );
        }
        default:
          return true;
      }
    },
    [],
  );

  const filteredAndSorted = useMemo(() => {
    if (!entries) return [];
    let result = entries.entries;
    if (severityFilters.size > 0)
      result = result.filter(
        (e) => e.severityLevel !== null && severityFilters.has(e.severityLevel),
      );
    if (statusFilters.size > 0)
      result = result.filter((e) => statusFilters.has(e.status));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((e) =>
        Object.values(e.rawData).some((v) => v.toLowerCase().includes(q)),
      );
    }
    for (const cf of columnFilters) {
      if (cf.value.trim())
        result = result.filter((e) => applyColumnFilter(e, cf));
    }
    if (sortField) {
      result = [...result].sort((a, b) => {
        let cmp = 0;
        if (sortField === "_severity") {
          cmp =
            (a.severityLevel ? severityConfig[a.severityLevel].numeric : 0) -
            (b.severityLevel ? severityConfig[b.severityLevel].numeric : 0);
        } else if (sortField === "_status") {
          cmp = a.status.localeCompare(b.status);
        } else {
          const aVal = a.rawData[sortField] ?? "";
          const bVal = b.rawData[sortField] ?? "";
          const aNum = parseFloat(aVal);
          const bNum = parseFloat(bVal);
          if (!isNaN(aNum) && !isNaN(bNum)) cmp = aNum - bNum;
          else cmp = aVal.localeCompare(bVal);
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
    columnFilters,
    applyColumnFilter,
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

  /* ---------- loading / error states ---------- */

  if (loading)
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-4 w-48" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[72px] rounded-xl" />
          ))}
        </div>
        <TableSkeleton />
      </div>
    );

  if (!upload)
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12">
        <AlertTriangle className="size-12 text-muted-foreground" />
        <p className="text-lg text-muted-foreground">Upload not found</p>
        <Button variant="outline" render={<Link href="/dashboard/uploads" />}>
          <ArrowLeft className="size-4" /> Back to uploads
        </Button>
      </div>
    );

  const getHeaderType = (key: string) =>
    upload.headers.find((h) => h.key === key)?.type ?? "text";
  const getOperatorsForType = (type: string) =>
    type === "number" || type === "integer" ? NUMBER_OPERATORS : TEXT_OPERATORS;

  const progressPercent =
    upload.totalEntries > 0
      ? Math.round((upload.processedEntries / upload.totalEntries) * 100)
      : 0;
  const startEntry = filteredAndSorted.length > 0 ? (page - 1) * LIMIT + 1 : 0;
  const endEntry = Math.min(page * LIMIT, entries?.total ?? 0);

  /* ---------- render ---------- */

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
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
        <div className="rounded-xl border border-primary/20 bg-primary/3 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="size-4 text-primary" />
            <span className="text-sm font-bold text-primary">AI Summary</span>
          </div>
          <p className="text-sm leading-relaxed text-foreground/80">
            {upload.aiSummary}
          </p>
        </div>
      )}

      {/* Tags */}
      {upload.aiTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {upload.aiTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full bg-primary/8 px-3 py-1 text-xs font-semibold text-primary"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Stat Pills */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          {
            label: "Total Entries",
            value: stats.total,
            cls: "text-foreground",
          },
          {
            label: "Critical (4-5)",
            value: stats.critical,
            cls: "text-red-500",
          },
          { label: "Pending", value: stats.pending, cls: "text-amber-500" },
          { label: "Resolved", value: stats.resolved, cls: "text-emerald-500" },
          {
            label: "No Action",
            value: stats.noAction,
            cls: "text-muted-foreground",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md"
          >
            <p className={`text-2xl font-extrabold tabular-nums ${s.cls}`}>
              {s.value}
            </p>
            <p className="text-[11px] font-medium text-muted-foreground mt-0.5">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* ============================================================ */}
      {/*  TOOLBAR                                                      */}
      {/* ============================================================ */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/60" />
            <Input
              placeholder="Search across all columns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-muted/30 border-transparent focus:border-primary/40"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Filter toggle */}
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            className="gap-1.5"
            onClick={() => setShowFilters((v) => !v)}
          >
            <SlidersHorizontal className="size-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-0.5 flex size-5 items-center justify-center rounded-full bg-primary-foreground/20 text-[10px] font-bold">
                {activeFilterCount}
              </span>
            )}
          </Button>

          {/* Column Visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm" className="gap-1.5" />
              }
            >
              <Columns3 className="size-3.5" />
              Columns
              <span className="text-[10px] font-bold text-muted-foreground ml-0.5">
                {visibleColumns.size}/{upload.headers.length}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-72" align="end">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Visible Columns</span>
                  <span className="text-[11px] font-normal text-muted-foreground">
                    {visibleColumns.size} of {upload.headers.length}
                  </span>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <div className="flex gap-1.5 px-2 pb-2">
                <button
                  onClick={showAllColumns}
                  className="cursor-pointer flex-1 rounded-lg bg-muted/60 px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground flex items-center justify-center gap-1.5"
                >
                  <Eye className="size-3" /> Show All
                </button>
                <button
                  onClick={resetColumns}
                  className="cursor-pointer flex-1 rounded-lg bg-muted/60 px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground flex items-center justify-center gap-1.5"
                >
                  <EyeOff className="size-3" /> Reset
                </button>
              </div>
              <DropdownMenuSeparator />
              <div className="max-h-64 overflow-y-auto">
                {upload.headers.map((header) => (
                  <DropdownMenuCheckboxItem
                    key={header.key}
                    checked={visibleColumns.has(header.key)}
                    onCheckedChange={() => toggleColumn(header.key)}
                    onSelect={(e) => e.preventDefault()}
                  >
                    <span className="truncate">{header.label}</span>
                    <span className="ml-auto text-[10px] text-muted-foreground/60 pl-2">
                      {header.type}
                    </span>
                  </DropdownMenuCheckboxItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Clear All */}
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" /> Clear All
            </Button>
          )}
        </div>

        {/* Expandable filter panel */}
        {showFilters && (
          <div className="border-t border-border px-4 py-4 space-y-5 bg-muted/20">
            {/* Severity & Status row */}
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2.5">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  Severity Level
                </p>
                <div className="flex flex-wrap gap-2">
                  {SEVERITY_LEVELS.map((level) => {
                    const active = severityFilters.has(level);
                    const sev = severityConfig[level];
                    return (
                      <button
                        key={level}
                        onClick={() => toggleSeverity(level)}
                        className={`cursor-pointer inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 border ${
                          active
                            ? `${sev.bg} ${sev.text} border-current/20 shadow-sm`
                            : "bg-card border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                        }`}
                      >
                        <span
                          className={`inline-block size-2 rounded-full ${sev.dot}`}
                        />
                        {sev.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2.5">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  Status
                </p>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(statusConfig) as EntryStatus[]).map((key) => {
                    const cfg = statusConfig[key];
                    const active = statusFilters.has(key);
                    return (
                      <button
                        key={key}
                        onClick={() => toggleStatus(key)}
                        className={`cursor-pointer inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 border ${
                          active
                            ? `${cfg.className} border-current/20 shadow-sm`
                            : "bg-card border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                        }`}
                      >
                        <span
                          className={`inline-block size-2 rounded-full ${cfg.dot}`}
                        />
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Column-specific filters */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  Column Filters
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 text-xs"
                  onClick={addColumnFilter}
                >
                  <Plus className="size-3" /> Add Filter
                </Button>
              </div>

              {columnFilters.length === 0 && (
                <p className="text-xs text-muted-foreground/60 italic">
                  No column filters. Click &quot;Add Filter&quot; to filter by
                  specific columns like date, age, region, etc.
                </p>
              )}

              {columnFilters.map((cf) => {
                const colType = getHeaderType(cf.columnKey);
                const ops = getOperatorsForType(colType);
                const isNumeric = colType === "number" || colType === "integer";
                return (
                  <div
                    key={cf.id}
                    className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-2.5"
                  >
                    {/* Column select */}
                    <select
                      value={cf.columnKey}
                      onChange={(e) => {
                        const newType = getHeaderType(e.target.value);
                        const newOps = getOperatorsForType(newType);
                        const validOp = newOps.some(
                          (o) => o.value === cf.operator,
                        );
                        updateColumnFilter(cf.id, {
                          columnKey: e.target.value,
                          operator: validOp
                            ? cf.operator
                            : (newOps[0].value as ColumnFilter["operator"]),
                        });
                      }}
                      className="h-8 rounded-md border border-border bg-background px-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 min-w-[140px]"
                    >
                      {upload.headers.map((h) => (
                        <option key={h.key} value={h.key}>
                          {h.label}
                        </option>
                      ))}
                    </select>

                    {/* Operator select */}
                    <select
                      value={cf.operator}
                      onChange={(e) =>
                        updateColumnFilter(cf.id, {
                          operator: e.target.value as ColumnFilter["operator"],
                        })
                      }
                      className="h-8 rounded-md border border-border bg-background px-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      {ops.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>

                    {/* Value input */}
                    <Input
                      type={isNumeric ? "number" : "text"}
                      placeholder={isNumeric ? "Value..." : "Search value..."}
                      value={cf.value}
                      onChange={(e) =>
                        updateColumnFilter(cf.id, { value: e.target.value })
                      }
                      className="h-8 w-36 text-xs"
                    />

                    {/* Second value for "between" */}
                    {cf.operator === "between" && (
                      <>
                        <span className="text-xs text-muted-foreground">
                          and
                        </span>
                        <Input
                          type="number"
                          placeholder="Max..."
                          value={cf.valueTo ?? ""}
                          onChange={(e) =>
                            updateColumnFilter(cf.id, {
                              valueTo: e.target.value,
                            })
                          }
                          className="h-8 w-28 text-xs"
                        />
                      </>
                    )}

                    {/* Remove */}
                    <button
                      onClick={() => removeColumnFilter(cf.id)}
                      className="cursor-pointer ml-auto flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/*  DATA TABLE                                                   */}
      {/* ============================================================ */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {entriesLoading ? (
          <div className="p-6">
            <TableSkeleton />
          </div>
        ) : entries && entries.entries.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent bg-muted/30">
                    <TableHead className="sticky left-0 z-10 w-[130px] bg-muted/30">
                      <button
                        onClick={() => toggleSort("_severity")}
                        className="cursor-pointer inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors hover:text-foreground"
                      >
                        Severity{" "}
                        <SortIndicator
                          field="_severity"
                          activeField={sortField}
                          dir={sortDir}
                        />
                      </button>
                    </TableHead>
                    <TableHead className="w-[110px]">
                      <button
                        onClick={() => toggleSort("_status")}
                        className="cursor-pointer inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors hover:text-foreground"
                      >
                        Status{" "}
                        <SortIndicator
                          field="_status"
                          activeField={sortField}
                          dir={sortDir}
                        />
                      </button>
                    </TableHead>
                    {visibleHeaders.map((h) => (
                      <TableHead key={h.key}>
                        <button
                          onClick={() => toggleSort(h.key)}
                          className="cursor-pointer inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors hover:text-foreground whitespace-nowrap"
                        >
                          {h.label}{" "}
                          <SortIndicator
                            field={h.key}
                            activeField={sortField}
                            dir={sortDir}
                          />
                        </button>
                      </TableHead>
                    ))}
                    <TableHead className="w-[40px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSorted.length > 0 ? (
                    filteredAndSorted.map((entry, idx) => {
                      const sev = entry.severityLevel
                        ? severityConfig[entry.severityLevel]
                        : null;
                      const stat = statusConfig[entry.status];
                      const isHigh =
                        entry.severityLevel === "HIGH" ||
                        entry.severityLevel === "CRITICAL";
                      const rowBg =
                        sev?.rowTint ||
                        (idx % 2 !== 0 ? "bg-muted/[0.04]" : "");

                      return (
                        <TableRow
                          key={entry.id}
                          onClick={() => setSelectedEntry(entry)}
                          className={`cursor-pointer transition-colors duration-100 hover:bg-accent/40 ${rowBg}`}
                        >
                          <TableCell className="sticky left-0 z-10 bg-inherit">
                            {sev ? (
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold ring-1 ${sev.badge}`}
                              >
                                <span
                                  className={`size-2 rounded-full ${sev.dot} ${isHigh ? "animate-pulse" : ""}`}
                                />
                                {sev.label}
                                {isHigh && <ShieldAlert className="size-3" />}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                —
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${stat.className}`}
                            >
                              <span
                                className={`size-1.5 rounded-full ${stat.dot}`}
                              />
                              {stat.label}
                            </span>
                          </TableCell>
                          {visibleHeaders.map((header) => {
                            const val = entry.rawData[header.key] ?? "";
                            const bool =
                              header.type === "boolean"
                                ? formatBool(val)
                                : null;
                            const display = bool ?? val;
                            return (
                              <TableCell
                                key={header.key}
                                className="max-w-[220px] truncate text-[13px]"
                                title={String(val)}
                              >
                                {header.type === "boolean" && bool ? (
                                  <span
                                    className={
                                      bool === "Yes"
                                        ? "font-semibold text-emerald-500"
                                        : "text-muted-foreground"
                                    }
                                  >
                                    {bool}
                                  </span>
                                ) : (
                                  <span className="text-foreground/80">
                                    {display || (
                                      <span className="text-muted-foreground/40">
                                        —
                                      </span>
                                    )}
                                  </span>
                                )}
                              </TableCell>
                            );
                          })}
                          <TableCell className="text-muted-foreground/40">
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
                          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/60">
                            <Filter className="size-6 text-muted-foreground/40" />
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
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 bg-muted/3">
              <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                <span>
                  Showing{" "}
                  <span className="font-semibold text-foreground tabular-nums">
                    {startEntry}–{endEntry}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-foreground tabular-nums">
                    {entries.total}
                  </span>
                </span>
                {activeFilterCount > 0 && (
                  <>
                    <span className="text-muted-foreground/40">|</span>
                    <span className="inline-flex items-center gap-1">
                      <Filter className="size-3" />
                      <span className="font-semibold text-foreground tabular-nums">
                        {filteredAndSorted.length}
                      </span>{" "}
                      matched
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-muted-foreground tabular-nums">
                  Page {page} of {entries?.totalPages ?? 1}
                </span>
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
            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/60">
              <FileSpreadsheet className="size-6 text-muted-foreground/40" />
            </div>
            <p className="font-medium text-muted-foreground">
              No entries found
            </p>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/*  ENTRY DETAIL SHEET                                           */}
      {/* ============================================================ */}
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
              const isHigh =
                selectedEntry.severityLevel === "HIGH" ||
                selectedEntry.severityLevel === "CRITICAL";

              return (
                <>
                  <SheetHeader className="pb-4">
                    <SheetTitle className="flex items-center gap-3">
                      Entry Details
                      {sev && (
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold ring-1 ${sev.badge}`}
                        >
                          <span className={`size-2 rounded-full ${sev.dot}`} />
                          {sev.label}
                          {isHigh && <ShieldAlert className="size-3" />}
                        </span>
                      )}
                    </SheetTitle>
                    <SheetDescription>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${stat.className}`}
                      >
                        <span className={`size-1.5 rounded-full ${stat.dot}`} />
                        {stat.label}
                      </span>
                    </SheetDescription>
                  </SheetHeader>

                  {isHigh && (
                    <div className="mx-4 mb-2">
                      <div className="rounded-xl border border-red-500/20 bg-red-500/4 overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-red-500/10">
                          <ShieldAlert className="size-4 text-red-500" />
                          <span className="text-xs font-bold uppercase tracking-wider text-red-500">
                            Why this severity?
                          </span>
                        </div>
                        <div className="px-4 py-3">
                          {reasonLoading ? (
                            <div className="flex items-center gap-2 text-sm text-red-400/70">
                              <RefreshCw className="size-3.5 animate-spin" />{" "}
                              Analyzing entry data...
                            </div>
                          ) : selectedEntry.severityReason ? (
                            <p className="text-sm leading-relaxed text-foreground/80">
                              {selectedEntry.severityReason}
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">
                              Reason not available — re-analyze to generate.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {!isHigh && selectedEntry.severityReason && (
                    <div className="mx-4 mb-2">
                      <div className="rounded-xl border border-amber-500/20 bg-amber-500/4 px-4 py-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-amber-500 mb-1.5">
                          AI Assessment
                        </p>
                        <p className="text-sm leading-relaxed text-foreground/80">
                          {selectedEntry.severityReason}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-0.5 px-4 pb-6">
                    {upload.headers.map((header) => {
                      const val = selectedEntry.rawData[header.key] ?? "";
                      const bool =
                        header.type === "boolean" ? formatBool(val) : null;
                      const display = bool ?? (val || "—");
                      const isBoolYes = bool === "Yes";
                      const isBoolNo = bool === "No";

                      return (
                        <div
                          key={header.key}
                          className="flex items-start justify-between gap-4 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/40"
                        >
                          <span className="text-[13px] font-medium text-muted-foreground leading-snug shrink-0 max-w-[50%]">
                            {header.label}
                          </span>
                          <span
                            className={`text-[13px] text-right leading-snug wrap-break-word min-w-0 ${
                              isBoolYes
                                ? "font-semibold text-emerald-500"
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

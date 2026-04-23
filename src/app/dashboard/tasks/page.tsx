"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { useEffect, useState } from "react";

type AssignmentStatus = "ASSIGNED" | "IN_PROGRESS" | "RESOLVED" | "ESCALATED";

interface TaskData {
  id: string;
  entryId: string;
  status: AssignmentStatus;
  note: string;
  volunteerNote: string | null;
  assignedByName: string;
  createdAt: string;
  updatedAt: string;
  entry: {
    id: string;
    severityLevel: string | null;
    severityReason: string | null;
    entryStatus: string;
    uploadId: string;
    uploadTitle: string;
    rawData: Record<string, string>;
  };
}

const assignmentStatusConfig: Record<
  AssignmentStatus,
  { label: string; cls: string; dot: string }
> = {
  ASSIGNED: {
    label: "Assigned",
    cls: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
    dot: "bg-blue-500",
  },
  IN_PROGRESS: {
    label: "In Progress",
    cls: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  RESOLVED: {
    label: "Resolved",
    cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  ESCALATED: {
    label: "Escalated",
    cls: "bg-red-500/15 text-red-600 dark:text-red-400",
    dot: "bg-red-500",
  },
};

const severityBadge: Record<string, { label: string; cls: string }> = {
  MINIMAL: { label: "Minimal", cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
  LOW: { label: "Low", cls: "bg-lime-500/15 text-lime-600 dark:text-lime-400" },
  MODERATE: { label: "Moderate", cls: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  HIGH: { label: "High", cls: "bg-orange-500/15 text-orange-600 dark:text-orange-400" },
  CRITICAL: { label: "Critical", cls: "bg-red-500/15 text-red-600 dark:text-red-400" },
};

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

const ALL_STATUSES: AssignmentStatus[] = ["ASSIGNED", "IN_PROGRESS", "RESOLVED", "ESCALATED"];

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<AssignmentStatus | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskData | null>(null);
  const [newStatus, setNewStatus] = useState<AssignmentStatus | "">("");
  const [statusNote, setStatusNote] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetch("/api/my-tasks")
      .then((r) => r.json())
      .then((data: TaskData[]) => {
        setTasks(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = activeFilter ? tasks.filter((t) => t.status === activeFilter) : tasks;

  const statusCounts = tasks.reduce(
    (acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  async function updateStatus() {
    if (!selectedTask || !newStatus) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/entries/${selectedTask.entryId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, note: statusNote }),
      });
      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === selectedTask.id
              ? { ...t, status: newStatus as AssignmentStatus, volunteerNote: statusNote || t.volunteerNote }
              : t,
          ),
        );
        setSelectedTask(null);
        setNewStatus("");
        setStatusNote("");
      }
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold tracking-tight text-foreground">My Tasks</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Tasks assigned to you by admins
        </p>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveFilter(null)}
          className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-all border ${
            !activeFilter
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card border-border text-muted-foreground hover:border-foreground/20"
          }`}
        >
          All ({tasks.length})
        </button>
        {ALL_STATUSES.map((s) => {
          const cfg = assignmentStatusConfig[s];
          const count = statusCounts[s] || 0;
          return (
            <button
              key={s}
              onClick={() => setActiveFilter(activeFilter === s ? null : s)}
              className={`cursor-pointer inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all border ${
                activeFilter === s
                  ? `${cfg.cls} border-current/20 shadow-sm`
                  : "bg-card border-border text-muted-foreground hover:border-foreground/20"
              }`}
            >
              <span className={`size-2 rounded-full ${cfg.dot}`} />
              {cfg.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Task cards */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-muted/60 mb-4">
            <ClipboardList className="size-7 text-muted-foreground/40" />
          </div>
          <p className="text-sm font-semibold text-foreground">No tasks found</p>
          <p className="text-xs text-muted-foreground mt-1">
            {activeFilter ? "Try changing the filter" : "No tasks have been assigned to you yet"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((task) => {
            const sev = task.entry.severityLevel
              ? severityBadge[task.entry.severityLevel]
              : null;
            const statusCfg = assignmentStatusConfig[task.status];
            const isHighSev =
              task.entry.severityLevel === "HIGH" ||
              task.entry.severityLevel === "CRITICAL";

            return (
              <button
                key={task.id}
                onClick={() => {
                  setSelectedTask(task);
                  setNewStatus("");
                  setStatusNote("");
                }}
                className={`cursor-pointer w-full rounded-2xl border-2 bg-card p-5 text-left transition-all hover:shadow-md ${
                  isHighSev ? "border-red-500/30" : "border-border hover:border-primary/30"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusCfg.cls}`}>
                    <span className={`size-1.5 rounded-full ${statusCfg.dot}`} />
                    {statusCfg.label}
                  </span>
                  {sev && (
                    <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold ${sev.cls}`}>
                      {isHighSev && <ShieldAlert className="size-3" />}
                      {sev.label}
                    </span>
                  )}
                </div>

                <p className="text-sm font-bold text-foreground truncate mb-1">
                  {task.entry.uploadTitle}
                </p>

                {task.note && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {task.note}
                  </p>
                )}

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <span className="text-[11px] text-muted-foreground">
                    {timeAgo(task.createdAt)} by {task.assignedByName}
                  </span>
                  <ChevronRight className="size-4 text-muted-foreground/30" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Task detail dialog */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">Task Details</h3>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-muted-foreground hover:text-foreground text-xl leading-none"
              >
                &times;
              </button>
            </div>

            {/* Current status */}
            <div className="flex items-center gap-3 mb-4">
              {(() => {
                const cfg = assignmentStatusConfig[selectedTask.status];
                return (
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${cfg.cls}`}>
                    <span className={`size-2 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                  </span>
                );
              })()}
              {selectedTask.entry.severityLevel && (
                <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold ${severityBadge[selectedTask.entry.severityLevel]?.cls}`}>
                  {severityBadge[selectedTask.entry.severityLevel]?.label}
                </span>
              )}
            </div>

            <div className="space-y-3 mb-4">
              <div className="rounded-xl bg-muted/30 p-4 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Upload
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {selectedTask.entry.uploadTitle}
                </p>
              </div>

              {selectedTask.note && (
                <div className="rounded-xl bg-blue-500/5 border border-blue-500/20 p-4 space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-500">
                    Admin Note
                  </p>
                  <p className="text-sm text-foreground/80">{selectedTask.note}</p>
                </div>
              )}

              {selectedTask.volunteerNote && (
                <div className="rounded-xl bg-muted/30 p-4 space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Your Last Note
                  </p>
                  <p className="text-sm text-foreground/80">{selectedTask.volunteerNote}</p>
                </div>
              )}

              {selectedTask.entry.severityReason && (
                <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-4 space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-500">
                    AI Assessment
                  </p>
                  <p className="text-sm text-foreground/80">
                    {selectedTask.entry.severityReason}
                  </p>
                </div>
              )}

              {/* Entry data preview */}
              <div className="rounded-xl border border-border p-4 space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Entry Data
                </p>
                {Object.entries(selectedTask.entry.rawData)
                  .slice(0, 8)
                  .map(([key, val]) => (
                    <div
                      key={key}
                      className="flex items-start justify-between gap-4 py-1.5"
                    >
                      <span className="text-[12px] text-muted-foreground shrink-0 max-w-[45%] truncate">
                        {key.replace(/_/g, " ")}
                      </span>
                      <span className="text-[12px] font-medium text-foreground text-right min-w-0 truncate">
                        {val || "—"}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Status update */}
            {selectedTask.status !== "RESOLVED" && (
              <div className="border-t border-border pt-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Update Status
                </p>
                <div className="flex gap-2">
                  {(["IN_PROGRESS", "RESOLVED", "ESCALATED"] as AssignmentStatus[])
                    .filter((s) => s !== selectedTask.status)
                    .map((s) => {
                      const cfg = assignmentStatusConfig[s];
                      const IconMap: Record<string, typeof Clock> = {
                        IN_PROGRESS: Clock,
                        RESOLVED: CheckCircle2,
                        ESCALATED: AlertTriangle,
                      };
                      const Icon = IconMap[s] ?? Clock;
                      return (
                        <button
                          key={s}
                          onClick={() => setNewStatus(s)}
                          className={`cursor-pointer flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold border-2 transition-all ${
                            newStatus === s
                              ? `${cfg.cls} border-current/30`
                              : "border-border text-muted-foreground hover:border-foreground/20"
                          }`}
                        >
                          <Icon className="size-3.5" />
                          {cfg.label}
                        </button>
                      );
                    })}
                </div>

                {newStatus && (
                  <>
                    <textarea
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      placeholder="Add a note about this status change..."
                      rows={2}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                    />
                    <Button
                      className="w-full"
                      disabled={updating}
                      onClick={updateStatus}
                    >
                      {updating ? (
                        <Loader2 className="size-4 animate-spin mr-2" />
                      ) : null}
                      {updating ? "Updating..." : `Mark as ${assignmentStatusConfig[newStatus as AssignmentStatus]?.label}`}
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

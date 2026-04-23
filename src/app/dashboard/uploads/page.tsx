"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, FileSpreadsheet, PlusCircle, ScrollText } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface UploadData {
  id: string;
  title: string;
  totalEntries: number;
  processedEntries: number;
  status: string;
  headers: string[];
  aiSummary: string | null;
  aiTags: string[];
  avgSeverity: number | null;
  criticalCount: number;
  createdAt: string;
  uploadedByName: string;
}

function severityBadge(avg: number | null): { text: string; cls: string } {
  if (avg === null)
    return { text: "N/A", cls: "bg-muted text-muted-foreground" };
  if (avg >= 4) return { text: "Critical", cls: "bg-red-500 text-white" };
  if (avg >= 3) return { text: "High", cls: "bg-orange-500 text-white" };
  if (avg >= 2) return { text: "Medium", cls: "bg-amber-500 text-white" };
  return { text: "Low", cls: "bg-emerald-500 text-white" };
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

function statusLabel(status: string): { label: string; cls: string } {
  switch (status) {
    case "done":
      return { label: "Done", cls: "text-emerald-400" };
    case "analyzing":
      return { label: "Analyzing", cls: "text-orange-400 animate-pulse" };
    case "parsing":
      return { label: "Parsing", cls: "text-yellow-400" };
    case "uploading":
      return { label: "Uploading", cls: "text-blue-400" };
    case "failed":
      return { label: "Failed", cls: "text-red-400" };
    default:
      return { label: status, cls: "text-muted-foreground" };
  }
}

function ListSkeleton() {
  return (
    <div className="flex h-full">
      <div className="flex-1 space-y-3 p-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[76px] rounded-xl" />
        ))}
      </div>
      <div className="w-72 space-y-4 border-l border-border p-6">
        <Skeleton className="h-6 w-28" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[88px] rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function UploadsPage() {
  const router = useRouter();
  const [uploads, setUploads] = useState<UploadData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch("/api/uploads")
      .then((r) => r.json())
      .then((data) => setUploads(data))
      .catch(() => setUploads([]))
      .finally(() => setLoading(false));

    // Check if current user is admin
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((session) => {
        if (session?.user?.role?.toUpperCase() === "ADMIN") {
          setIsAdmin(true);
        }
      })
      .catch(() => {});
  }, []);

  if (loading) {
    return (
      <div className="-m-6">
        <ListSkeleton />
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-57px-3rem)] -m-6">
      {/* Main data table */}
      <div className="flex-1 p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">
              Uploads
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {uploads.length} dataset{uploads.length !== 1 ? "s" : ""} uploaded
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button
                variant="outline"
                render={<Link href="/dashboard/audit-logs" />}
                className="gap-1.5"
              >
                <ScrollText className="size-4" />
                Audit Logs
              </Button>
            )}
            <Button
              render={<Link href="/dashboard/uploads/new" />}
              className="gap-1.5"
            >
              <PlusCircle className="size-4" />
              New Upload
            </Button>
          </div>
        </div>

        {uploads.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-20 text-center">
            <FileSpreadsheet className="size-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold">No uploads yet</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Upload a CSV or spreadsheet to get started
            </p>
            <Button
              render={<Link href="/dashboard/uploads/new" />}
              className="gap-1.5"
            >
              <PlusCircle className="size-4" />
              New Upload
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {uploads.map((upload) => {
              const sev = severityBadge(upload.avgSeverity);
              const st = statusLabel(upload.status);
              return (
                <button
                  key={upload.id}
                  onClick={() => router.push(`/dashboard/uploads/${upload.id}`)}
                  className="w-full rounded-xl border border-border bg-card p-5 flex items-center gap-4 text-left transition-all duration-200 hover:bg-accent/50 hover:border-border/80 hover:shadow-md group "
                >
                  {/* Upload Title */}
                  <div className="w-[22%] min-w-0 shrink-0">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1 font-medium">
                      Upload Title
                    </p>
                    <p className="text-[15px] font-bold text-foreground truncate">
                      {upload.title}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1 font-medium">
                      Data Overview
                    </p>
                    <p className="text-[14px] font-bold text-foreground">
                      {upload.totalEntries} entries
                      {upload.criticalCount > 0 && (
                        <span className="text-red-500 ml-2">
                          &middot; {upload.criticalCount} critical
                        </span>
                      )}
                      <span className="text-muted-foreground font-medium ml-2">
                        &middot; <span className={st.cls}>{st.label}</span>
                      </span>
                    </p>
                  </div>

                  {/* Upload Date */}
                  <div className="w-[130px] shrink-0 hidden sm:block">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1 font-medium">
                      Upload Date
                    </p>
                    <p className="text-[14px] font-medium text-muted-foreground">
                      {new Date(upload.createdAt).toLocaleDateString(
                        undefined,
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </p>
                  </div>

                  {/* Severity Badge */}
                  <div className="w-24 shrink-0 flex items-center justify-center">
                    <span
                      className={`text-[12px] font-bold py-2 px-5 rounded-2xl text-center uppercase tracking-wide ${sev.cls}`}
                    >
                      {sev.text}
                    </span>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="size-5 text-muted-foreground/40 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Right sidebar: Latest Uploads */}
      {/* <aside className="hidden lg:flex w-72 shrink-0 flex-col border-l border-border bg-card/50 overflow-y-auto">
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-bold text-foreground">Latest Uploads</h3>

          {uploads.slice(0, 8).map((upload) => {
            const sev = severityBadge(upload.avgSeverity);
            return (
              <button
                key={upload.id}
                onClick={() => router.push(`/dashboard/uploads/${upload.id}`)}
                className="w-full rounded-xl border border-border bg-card p-4 flex flex-col gap-2 text-left transition-all hover:border-primary/30 hover:shadow-md group"
              >
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-muted/60 mt-0.5">
                    <FileSpreadsheet className="size-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-foreground truncate">
                      {upload.title}
                    </p>
                    <p className="text-[12px] text-muted-foreground mt-0.5">
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
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-1 rounded-lg shrink-0 ${sev.cls}`}
                  >
                    {sev.text}
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground/60 pl-9">
                  {timeAgo(upload.createdAt)}
                </span>
              </button>
            );
          })}

          {uploads.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-muted/60 mb-3">
                <FileSpreadsheet className="size-5 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-semibold text-foreground">
                No uploads yet
              </p>
            </div>
          )}
        </div>
      </aside> */}
    </div>
  );
}

"use client";

import { CardSkeleton } from "@/components/skeletons/card-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertTriangle,
  Clock,
  FileSpreadsheet,
  PlusCircle,
} from "lucide-react";
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

const statusConfig: Record<string, { label: string; className: string }> = {
  uploading: {
    label: "Uploading",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  },
  parsing: {
    label: "Parsing",
    className:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  },
  analyzing: {
    label: "Analyzing",
    className:
      "bg-orange-100 text-orange-700 animate-pulse dark:bg-orange-900/40 dark:text-orange-300",
  },
  done: {
    label: "Done",
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  },
  failed: {
    label: "Failed",
    className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  },
};

function severityColor(avg: number | null | undefined) {
  if (avg == null) return "bg-muted";
  if (avg >= 4) return "bg-red-500";
  if (avg >= 3) return "bg-orange-400";
  if (avg >= 2) return "bg-amber-400";
  return "bg-green-500";
}

export default function UploadsPage() {
  const router = useRouter();
  const [uploads, setUploads] = useState<UploadData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/uploads")
      .then((r) => r.json())
      .then((data) => setUploads(data))
      .catch(() => setUploads([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Uploads</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage and review your uploaded datasets
          </p>
        </div>
        <Button render={<Link href="/dashboard/uploads/new" />}>
          <PlusCircle className="size-4 mr-1.5" />
          New Upload
        </Button>
      </div>

      {loading ? (
        <CardSkeleton />
      ) : uploads.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-20 text-center">
          <FileSpreadsheet className="size-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold">No uploads yet</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Upload a CSV or spreadsheet to get started
          </p>
          <Button render={<Link href="/dashboard/uploads/new" />}>
            <PlusCircle className="size-4 mr-1.5" />
            New Upload
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {uploads.map((upload) => {
            const status = statusConfig[upload.status];
            return (
              <Card
                key={upload.id}
                className="flex flex-col cursor-pointer border border-border bg-card shadow-sm shadow-black/5 transition-all duration-200 hover:shadow-lg hover:border-primary/30 hover:scale-105 ease-in-out hover:-translate-y-0.5 active:translate-y-0 active:shadow-md"
                onClick={() => router.push(`/dashboard/uploads/${upload.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base font-bold leading-tight">
                      {upload.title}
                    </CardTitle>
                    <span
                      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="flex flex-1 flex-col gap-3">
                  {upload.aiSummary && (
                    <CardDescription className="line-clamp-2">
                      {upload.aiSummary}
                    </CardDescription>
                  )}

                  <div className="mt-auto space-y-3">
                    {upload.aiTags && upload.aiTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {upload.aiTags.map((tag: string) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-[0.65rem] px-1.5 py-0"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FileSpreadsheet className="size-3" />
                        {upload.totalEntries} entries
                      </span>
                      {upload.criticalCount > 0 && (
                        <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                          <AlertTriangle className="size-3" />
                          {upload.criticalCount} critical
                        </span>
                      )}
                      <span
                        className={`size-2 rounded-full ${severityColor(upload.avgSeverity)}`}
                        title={`Avg severity: ${upload.avgSeverity}`}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border text-xs text-muted-foreground">
                      <span>{upload.uploadedByName ?? "Unknown"}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {new Date(upload.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

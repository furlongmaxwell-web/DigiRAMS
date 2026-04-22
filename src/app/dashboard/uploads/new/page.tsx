"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileSpreadsheet, Loader2, Check } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Papa from "papaparse";

interface FilePreview {
  rowCount: number;
  columns: string[];
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function NewUploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<FilePreview | null>(null);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const parsePreview = useCallback((f: File) => {
    Papa.parse(f, {
      header: true,
      preview: 5,
      skipEmptyLines: true,
      complete(results) {
        const columns = results.meta.fields?.slice(0, 3) ?? [];
        const total = results.data.length;

        Papa.parse(f, {
          header: false,
          skipEmptyLines: true,
          complete(fullResults) {
            setPreview({
              rowCount: Math.max(0, fullResults.data.length - 1),
              columns,
            });
          },
        });

        if (total === 0) {
          setPreview({ rowCount: 0, columns });
        }
      },
      error() {
        setPreview(null);
        toast.error("Could not parse this file. Is it a valid CSV?");
      },
    });
  }, []);

  const handleFileSelect = useCallback(
    (f: File | undefined) => {
      if (!f) return;
      setFile(f);
      setPreview(null);
      if (f.name.endsWith(".csv")) {
        parsePreview(f);
      }
    },
    [parsePreview]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const droppedFile = e.dataTransfer.files?.[0];
      handleFileSelect(droppedFile);
    },
    [handleFileSelect]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !title.trim()) {
      toast.error("Please provide a title and select a file.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title.trim());

      const res = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Upload failed");
      }

      const data = await res.json();
      toast.success("Upload created successfully!");
      router.push(`/dashboard/uploads/${data.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New Upload</h1>
        <p className="text-muted-foreground text-sm">
          Upload a CSV or Excel file for AI-powered analysis
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g. Q1 Safety Incidents"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>File</Label>
              <div
                role="button"
                tabIndex={0}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ")
                    fileInputRef.current?.click();
                }}
                className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-10 text-center transition-colors cursor-pointer ${
                  dragging
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
                }`}
              >
                <Upload
                  className={`size-10 ${dragging ? "text-primary" : "text-muted-foreground/50"}`}
                />
                <div>
                  <p className="font-medium text-sm">
                    Drag &amp; drop your CSV file
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    or click to browse
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Supports .csv and .xlsx files
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files?.[0])}
                />
              </div>
            </div>

            {file && (
              <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3">
                <FileSpreadsheet className="size-5 shrink-0 text-green-600" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <Check className="size-4 shrink-0 text-green-600" />
              </div>
            )}

            {preview && (
              <div className="rounded-lg border bg-muted/20 px-4 py-3 space-y-2">
                <p className="text-sm font-medium">
                  Preview:{" "}
                  <span className="text-muted-foreground font-normal">
                    {preview.rowCount.toLocaleString()} rows detected
                  </span>
                </p>
                {preview.columns.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {preview.columns.map((col) => (
                      <Badge key={col} variant="secondary" className="text-xs">
                        {col}
                      </Badge>
                    ))}
                    {preview.columns.length === 3 && (
                      <span className="text-xs text-muted-foreground self-center">
                        + more columns
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={submitting || !file || !title.trim()}
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 mr-1.5 animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <Upload className="size-4 mr-1.5" />
                  Upload File
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

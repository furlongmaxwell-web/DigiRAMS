export interface HeaderSchema {
  key: string;
  label: string;
  type: "text" | "number" | "boolean" | "date";
}

export interface UploadWithMeta {
  id: string;
  title: string;
  totalEntries: number;
  processedEntries: number;
  status: string;
  headers: HeaderSchema[];
  aiSummary: string | null;
  aiTags: string[];
  avgSeverity: number | null;
  criticalCount: number;
  createdAt: string;
  uploadedByName: string;
}

export type SeverityLevelType = "MINIMAL" | "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
export type StatusType = "PENDING" | "RESOLVED" | "NO_ACTION_NEEDED";

export interface EntryRow {
  id: string;
  rawData: Record<string, string | number | null>;
  severityLevel: SeverityLevelType | null;
  severityReason: string | null;
  status: StatusType;
  createdAt: string;
}

export type UserRole = "ADMIN" | "VOLUNTEER";

import Papa from "papaparse";
import type { HeaderSchema } from "@/types";

export function normalizeKey(header: string): string {
  return header
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function inferType(values: string[]): HeaderSchema["type"] {
  const sample = values.filter((v) => v !== "" && v !== null).slice(0, 10);
  if (sample.length === 0) return "text";

  const allNumbers = sample.every((v) => !isNaN(Number(v)));
  if (allNumbers) return "number";

  const boolValues = new Set([
    "yes",
    "no",
    "true",
    "false",
    "1",
    "0",
    "y",
    "n",
  ]);
  const allBool = sample.every((v) => boolValues.has(v.toLowerCase()));
  if (allBool) return "boolean";

  return "text";
}

export function parseCSV(fileContent: string): {
  headers: HeaderSchema[];
  rows: Record<string, string>[];
} {
  const result = Papa.parse(fileContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) => h.trim(),
  });

  const rawHeaders = result.meta.fields || [];
  const data = result.data as Record<string, string>[];

  const headers: HeaderSchema[] = rawHeaders.map((rawHeader) => {
    const columnValues = data.map((row) => row[rawHeader] || "");
    return {
      key: normalizeKey(rawHeader),
      label: rawHeader,
      type: inferType(columnValues),
    };
  });

  const rows = data.map((row) => {
    const normalized: Record<string, string> = {};
    rawHeaders.forEach((rawHeader, idx) => {
      normalized[headers[idx].key] = row[rawHeader] ?? "";
    });
    return normalized;
  });

  return { headers, rows };
}

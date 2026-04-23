import * as XLSX from "xlsx";
import { parseCSV } from "./csv-parser";
import type { HeaderSchema } from "@/types";
import { normalizeKey } from "./csv-parser";
import { sanitizeCell } from "./sanitize";

function inferType(values: string[]): HeaderSchema["type"] {
  const sample = values.filter((v) => v !== "" && v != null).slice(0, 10);
  if (sample.length === 0) return "text";

  if (sample.every((v) => !isNaN(Number(v)))) return "number";

  const boolValues = new Set(["yes", "no", "true", "false", "1", "0", "y", "n"]);
  if (sample.every((v) => boolValues.has(String(v).toLowerCase()))) return "boolean";

  return "text";
}

export function parseXLSX(buffer: ArrayBuffer): {
  headers: HeaderSchema[];
  rows: Record<string, string>[];
} {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return { headers: [], rows: [] };

  const sheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });

  if (rawData.length === 0) return { headers: [], rows: [] };

  const rawHeaders = Object.keys(rawData[0]);
  const headers: HeaderSchema[] = rawHeaders.map((rawHeader) => {
    const columnValues = rawData.map((row) => String(row[rawHeader] ?? ""));
    return {
      key: normalizeKey(rawHeader),
      label: rawHeader,
      type: inferType(columnValues),
    };
  });

  const rows = rawData.map((row) => {
    const normalized: Record<string, string> = {};
    rawHeaders.forEach((rawHeader, idx) => {
      normalized[headers[idx].key] = sanitizeCell(row[rawHeader] ?? "");
    });
    return normalized;
  });

  return { headers, rows };
}

export function parseSpreadsheet(
  file: { name: string; buffer: ArrayBuffer; text: string },
): { headers: HeaderSchema[]; rows: Record<string, string>[] } {
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "xlsx" || ext === "xls") {
    return parseXLSX(file.buffer);
  }

  return parseCSV(file.text);
}

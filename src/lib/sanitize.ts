const SCRIPT_PATTERNS = [
  /(<\s*script[\s>])/gi,
  /(<\s*\/\s*script\s*>)/gi,
  /(javascript\s*:)/gi,
  /(vbscript\s*:)/gi,
  /(on\w+\s*=\s*["'])/gi, // onclick=", onerror=", etc.
  /(<\s*iframe[\s>])/gi,
  /(<\s*object[\s>])/gi,
  /(<\s*embed[\s>])/gi,
  /(<\s*link[\s>])/gi,
  /(<\s*style[\s>])/gi,
  /(<\s*img[^>]+onerror)/gi,
  /(data\s*:\s*text\/html)/gi,
];

const SQL_PATTERNS = [
  /(\b(?:DROP|ALTER|TRUNCATE|DELETE|INSERT|UPDATE|CREATE|EXEC|EXECUTE)\s+(?:TABLE|DATABASE|INDEX|PROCEDURE|FUNCTION|INTO|FROM|SET)\b)/gi,
  /(--\s*$)/gm,
  /(;\s*(?:DROP|ALTER|DELETE|INSERT|UPDATE|CREATE|EXEC)\b)/gi,
  /(\bUNION\s+(?:ALL\s+)?SELECT\b)/gi,
  /(\bSELECT\s+.+\s+FROM\s+.+\s+WHERE\b)/gi,
  /(\/\*[\s\S]*?\*\/)/g,
  /(\bxp_cmdshell\b)/gi,
  /(\bsp_executesql\b)/gi,
];

const COMMAND_PATTERNS = [
  /(\$\(.*\))/g,        // $(command)
  /(`.+`)/g,            // `command`
  /(\|\s*\w+)/g,        // | pipe to command
  /(&&\s*\w+)/g,        // && chain command
  /(;\s*(?:rm|del|format|mkfs|dd|wget|curl|nc|netcat|python|node|bash|sh|cmd|powershell)\b)/gi,
];

const EXECUTABLE_EXTENSIONS = new Set([
  "exe", "bat", "cmd", "com", "msi", "ps1", "vbs", "vbe", "js",
  "jse", "wsf", "wsh", "scr", "pif", "py", "rb", "pl", "sh",
  "bash", "cgi", "php", "asp", "aspx", "jsp", "war", "jar",
  "dll", "so", "dylib", "elf", "bin", "run", "app", "action",
]);

const MAX_CELL_LENGTH = 5000;
const MAX_TITLE_LENGTH = 200;
const MAX_ROWS = 50_000;
const MAX_COLUMNS = 200;
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

/**
 * Strips null bytes and non-printable control characters (keeps tabs, newlines, carriage returns).
 */
function stripControlChars(value: string): string {
  return value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}

/**
 * Prevents CSV formula injection by escaping cells starting with formula triggers.
 * Prefixes with a single-quote so spreadsheet apps treat it as text.
 */
function defangFormula(value: string): string {
  const trimmed = value.trimStart();
  if (/^[=+\-@\t\r]/.test(trimmed)) {
    return "'" + trimmed;
  }
  return value;
}

/**
 * Sanitizes a single cell value: strips dangerous patterns, control chars,
 * formula injection, and enforces max length.
 */
export function sanitizeCell(raw: unknown): string {
  if (raw === null || raw === undefined) return "";
  let value = String(raw);

  value = stripControlChars(value);

  for (const pattern of SCRIPT_PATTERNS) {
    pattern.lastIndex = 0;
    value = value.replace(pattern, "[blocked]");
  }

  for (const pattern of SQL_PATTERNS) {
    pattern.lastIndex = 0;
    value = value.replace(pattern, "[blocked]");
  }

  for (const pattern of COMMAND_PATTERNS) {
    pattern.lastIndex = 0;
    value = value.replace(pattern, "[blocked]");
  }

  value = defangFormula(value);

  if (value.length > MAX_CELL_LENGTH) {
    value = value.slice(0, MAX_CELL_LENGTH) + "…[truncated]";
  }

  return value;
}

/**
 * Sanitizes a title string.
 */
export function sanitizeTitle(raw: string): string {
  let value = stripControlChars(raw.trim());

  value = value.replace(/<[^>]*>/g, "");

  if (value.length > MAX_TITLE_LENGTH) {
    value = value.slice(0, MAX_TITLE_LENGTH);
  }

  return value;
}

/**
 * Sanitizes all values in a row object.
 */
export function sanitizeRow(row: Record<string, unknown>): Record<string, string> {
  const sanitized: Record<string, string> = {};
  for (const [key, value] of Object.entries(row)) {
    const safeKey = sanitizeCell(key).replace(/[^a-zA-Z0-9_ ]/g, "");
    sanitized[safeKey || "column"] = sanitizeCell(value);
  }
  return sanitized;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates an uploaded file for security: extension, size, and magic bytes.
 */
export function validateUploadedFile(
  file: { name: string; size: number; buffer: ArrayBuffer },
): FileValidationResult {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.` };
  }

  if (file.size === 0) {
    return { valid: false, error: "File is empty." };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (EXECUTABLE_EXTENSIONS.has(ext)) {
    return { valid: false, error: `Executable files (.${ext}) are not allowed.` };
  }

  const ALLOWED_EXTENSIONS = new Set(["csv", "xlsx", "xls"]);
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return { valid: false, error: "Only .csv, .xlsx, and .xls files are allowed." };
  }

  const bytes = new Uint8Array(file.buffer.slice(0, 8));

  if (ext === "xlsx") {
    const isZip = bytes[0] === 0x50 && bytes[1] === 0x4B;
    if (!isZip) {
      return { valid: false, error: "File does not appear to be a valid .xlsx file (invalid signature)." };
    }
  }

  if (ext === "xls") {
    const isOLE = bytes[0] === 0xD0 && bytes[1] === 0xCF && bytes[2] === 0x11 && bytes[3] === 0xE0;
    const isZip = bytes[0] === 0x50 && bytes[1] === 0x4B;
    if (!isOLE && !isZip) {
      return { valid: false, error: "File does not appear to be a valid .xls file (invalid signature)." };
    }
  }

  if (ext === "csv") {
    const head = new TextDecoder().decode(file.buffer.slice(0, 512));
    if (/^(%PDF|PK|\x7fELF|MZ|\xD0\xCF)/.test(head)) {
      return { valid: false, error: "File content does not match .csv format." };
    }
  }

  return { valid: true };
}

/**
 * Validates parsed data dimensions.
 */
export function validateDataLimits(
  rows: unknown[],
  columnCount: number,
): FileValidationResult {
  if (rows.length > MAX_ROWS) {
    return { valid: false, error: `Too many rows (${rows.length}). Maximum is ${MAX_ROWS.toLocaleString()}.` };
  }
  if (columnCount > MAX_COLUMNS) {
    return { valid: false, error: `Too many columns (${columnCount}). Maximum is ${MAX_COLUMNS}.` };
  }
  return { valid: true };
}

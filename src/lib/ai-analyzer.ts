import { generateText } from "ai";
import { prisma } from "./prisma";
import { deepseek } from "./ai";
import { SeverityLevel, Status } from "@/generated/prisma/client";
import { sanitizeRow } from "./sanitize";

const BATCH_SIZE = 30;
const MAX_CONCURRENT = 5;

const SEVERITY_SYSTEM_PROMPT = `You are a humanitarian data analyst. Analyze survey entries and assign severity levels.

For each entry, assign:
- severity_level: one of MINIMAL, LOW, MODERATE, HIGH, CRITICAL
  - CRITICAL: Person needs aid, did NOT receive it, multiple access obstacles, unsafe conditions
  - HIGH: Needs aid, received some but doesn't cover basic needs, significant obstacles
  - MODERATE: Received aid, partially covers needs, some difficulties
  - LOW: Received aid, mostly covers needs, minor issues
  - MINIMAL: Received aid, needs fully covered, no issues
- status: "PENDING" for LOW/MODERATE/HIGH/CRITICAL, "NO_ACTION_NEEDED" for MINIMAL
- reason: A concise 1-2 sentence explanation of WHY this severity was assigned, citing specific data from the entry (e.g. "Respondent needs aid but has not received any. Reports military restrictions blocking access and unsafe conditions for aid workers in Shan state.")

Consider these factors for severity:
- Did they receive aid vs need aid
- Did aid cover basic needs (Not at all = high severity)
- Access obstacles (unsafe, military, government restrictions = higher)
- Aid presence changing (Reduced = higher, Increased = lower)
- Specific difficulties mentioned

Respond ONLY with a valid JSON array. No explanation. Format:
[{"id": "entry_id", "severity_level": "MINIMAL|LOW|MODERATE|HIGH|CRITICAL", "status": "PENDING|NO_ACTION_NEEDED", "reason": "..."}]`;

const SUMMARY_SYSTEM_PROMPT = `You are a humanitarian data analyst. Analyze the survey data and provide:
1. A concise summary (3-5 sentences) of the key findings, highlighting the most urgent needs and concerning patterns.
2. A list of relevant tags categorizing the issues found.

Focus on: unmet needs, access obstacles, aid effectiveness, regional patterns, and safety concerns.

Respond ONLY with valid JSON. Format:
{"summary": "...", "tags": ["tag1", "tag2", ...]}`;

const VALID_SEVERITY = new Set<string>(Object.values(SeverityLevel));
const VALID_STATUS = new Set<string>(Object.values(Status));

function parseSeverity(val: string | number): SeverityLevel {
  if (typeof val === "string" && VALID_SEVERITY.has(val)) return val as SeverityLevel;
  const numMap: Record<number, SeverityLevel> = {
    1: SeverityLevel.MINIMAL,
    2: SeverityLevel.LOW,
    3: SeverityLevel.MODERATE,
    4: SeverityLevel.HIGH,
    5: SeverityLevel.CRITICAL,
  };
  if (typeof val === "number" && numMap[val]) return numMap[val];
  return SeverityLevel.MODERATE;
}

function parseStatus(val: string): Status {
  if (VALID_STATUS.has(val)) return val as Status;
  const map: Record<string, Status> = {
    pending: Status.PENDING,
    resolved: Status.RESOLVED,
    no_action_needed: Status.NO_ACTION_NEEDED,
  };
  return map[val] ?? Status.PENDING;
}

function extractJSON(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const raw = text.match(/[\[{][\s\S]*[\]}]/);
  if (raw) return raw[0].trim();
  return text.trim();
}

const SEVERITY_TO_NUM: Record<string, number> = {
  MINIMAL: 1, LOW: 2, MODERATE: 3, HIGH: 4, CRITICAL: 5,
};

interface BatchInput {
  index: number;
  entries: { id: string; rawData: string }[];
  batchData: Record<string, unknown>[];
}

interface BatchResult {
  id: string;
  severity_level: string | number;
  status: string;
  reason?: string;
}

async function analyzeBatch(batch: BatchInput): Promise<{ results: BatchResult[]; batchData: Record<string, unknown>[] }> {
  const { text } = await generateText({
    model: deepseek("deepseek-chat"),
    system: SEVERITY_SYSTEM_PROMPT,
    prompt: JSON.stringify(batch.batchData),
    temperature: 0.1,
    maxOutputTokens: 8192,
  });

  const results: BatchResult[] = JSON.parse(extractJSON(text));
  return { results, batchData: batch.batchData };
}

async function runWithConcurrency<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  concurrency: number,
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const idx = nextIndex++;
      try {
        results[idx] = { status: "fulfilled", value: await fn(items[idx]) };
      } catch (reason) {
        results[idx] = { status: "rejected", reason };
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return results;
}

export async function analyzeUpload(uploadId: string): Promise<void> {
  try {
    const entries = await prisma.surveyEntry.findMany({
      where: { uploadId },
    });

    if (entries.length === 0) {
      await prisma.upload.update({
        where: { id: uploadId },
        data: { status: "done", processedEntries: 0 },
      });
      return;
    }

    await prisma.upload.update({
      where: { id: uploadId },
      data: { status: "analyzing" },
    });

    const batches: BatchInput[] = [];
    for (let i = 0; i < entries.length; i += BATCH_SIZE) {
      const slice = entries.slice(i, i + BATCH_SIZE);
      batches.push({
        index: i,
        entries: slice,
        batchData: slice.map((e) => {
          const parsed = JSON.parse(e.rawData);
          const safe = sanitizeRow(parsed);
          return { id: e.id, ...safe };
        }),
      });
    }

    const allRawData: Record<string, unknown>[] = [];
    let totalProcessed = 0;

    const settled = await runWithConcurrency(batches, analyzeBatch, MAX_CONCURRENT);

    for (let i = 0; i < settled.length; i++) {
      const batch = batches[i];
      const outcome = settled[i];

      if (outcome.status === "fulfilled") {
        const { results, batchData } = outcome.value;
        allRawData.push(...batchData);

        for (const result of results) {
          await prisma.surveyEntry.update({
            where: { id: result.id },
            data: {
              severityLevel: parseSeverity(result.severity_level),
              severityReason: result.reason || null,
              status: parseStatus(result.status),
            },
          });
        }
      } else {
        console.error(`Batch ${i} failed:`, outcome.reason);
        allRawData.push(...batch.batchData);
        for (const entry of batch.entries) {
          await prisma.surveyEntry.update({
            where: { id: entry.id },
            data: { severityLevel: SeverityLevel.MODERATE, status: Status.PENDING },
          });
        }
      }

      totalProcessed += batch.entries.length;
      await prisma.upload.update({
        where: { id: uploadId },
        data: { processedEntries: totalProcessed },
      });
    }

    // Summary generation
    try {
      const sampleData = allRawData.slice(0, 50);
      const { text: summaryText } = await generateText({
        model: deepseek("deepseek-chat"),
        system: SUMMARY_SYSTEM_PROMPT,
        prompt: `Analyze these ${entries.length} survey entries (showing sample of ${sampleData.length}):\n${JSON.stringify(sampleData)}`,
        temperature: 0.1,
        maxOutputTokens: 4096,
      });

      const summaryResult: { summary: string; tags: string[] } = JSON.parse(extractJSON(summaryText));
      const stats = await computeUploadStats(uploadId);

      await prisma.upload.update({
        where: { id: uploadId },
        data: {
          aiSummary: summaryResult.summary,
          aiTags: JSON.stringify(summaryResult.tags),
          ...stats,
          processedEntries: entries.length,
          status: "done",
        },
      });
    } catch (summaryError) {
      console.error("Summary generation failed:", summaryError);
      const stats = await computeUploadStats(uploadId);

      await prisma.upload.update({
        where: { id: uploadId },
        data: {
          aiSummary: "Analysis completed but summary generation failed. Please review entries individually.",
          aiTags: "[]",
          ...stats,
          processedEntries: entries.length,
          status: "done",
        },
      });
    }
  } catch (error) {
    console.error("Upload analysis failed:", error);
    await prisma.upload.update({
      where: { id: uploadId },
      data: { status: "failed" },
    });
  }
}

async function computeUploadStats(uploadId: string) {
  const updatedEntries = await prisma.surveyEntry.findMany({
    where: { uploadId },
    select: { severityLevel: true },
  });

  const numericSeverities = updatedEntries
    .map((e) => (e.severityLevel ? SEVERITY_TO_NUM[e.severityLevel] ?? 0 : 0))
    .filter((s) => s > 0);

  const avgSeverity =
    numericSeverities.length > 0
      ? numericSeverities.reduce((a, b) => a + b, 0) / numericSeverities.length
      : 0;

  const criticalCount = updatedEntries.filter(
    (e) => e.severityLevel === SeverityLevel.HIGH || e.severityLevel === SeverityLevel.CRITICAL,
  ).length;

  return {
    avgSeverity: Math.round(avgSeverity * 10) / 10,
    criticalCount,
  };
}

import { prisma } from "./prisma";
import { SeverityLevel, Status } from "@/generated/prisma/client";

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";
const BATCH_SIZE = 30;

async function callDeepSeek(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey || apiKey === "your-deepseek-api-key-here") {
    throw new Error("DEEPSEEK_API_KEY is not configured");
  }

  const response = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.1,
      max_tokens: 8192,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`DeepSeek API error: ${response.status} - ${err}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

function extractJSON(text: string): string {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) return match[1].trim();

  const jsonMatch = text.match(/[\[{][\s\S]*[\]}]/);
  if (jsonMatch) return jsonMatch[0].trim();

  return text.trim();
}

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

const VALID_SEVERITY: Set<string> = new Set(Object.values(SeverityLevel));
const VALID_STATUS: Set<string> = new Set(Object.values(Status));

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

    let totalProcessed = 0;
    const allRawData: Record<string, string>[] = [];

    for (let i = 0; i < entries.length; i += BATCH_SIZE) {
      const batch = entries.slice(i, i + BATCH_SIZE);
      const batchData = batch.map((e) => ({
        id: e.id,
        ...JSON.parse(e.rawData),
      }));

      allRawData.push(...batchData);

      try {
        const response = await callDeepSeek(
          SEVERITY_SYSTEM_PROMPT,
          JSON.stringify(batchData)
        );

        const jsonStr = extractJSON(response);
        const results: {
          id: string;
          severity_level: string | number;
          status: string;
          reason?: string;
        }[] = JSON.parse(jsonStr);

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
      } catch (batchError) {
        console.error(`Batch analysis failed for batch starting at ${i}:`, batchError);
        for (const entry of batch) {
          await prisma.surveyEntry.update({
            where: { id: entry.id },
            data: { severityLevel: SeverityLevel.MODERATE, status: Status.PENDING },
          });
        }
      }

      totalProcessed += batch.length;
      await prisma.upload.update({
        where: { id: uploadId },
        data: { processedEntries: totalProcessed },
      });
    }

    try {
      const sampleData = allRawData.slice(0, 50);
      const summaryResponse = await callDeepSeek(
        SUMMARY_SYSTEM_PROMPT,
        `Analyze these ${entries.length} survey entries (showing sample of ${sampleData.length}):\n${JSON.stringify(sampleData)}`
      );

      const jsonStr = extractJSON(summaryResponse);
      const summaryResult: { summary: string; tags: string[] } = JSON.parse(jsonStr);

      const updatedEntries = await prisma.surveyEntry.findMany({
        where: { uploadId },
        select: { severityLevel: true },
      });

      const severityToNum: Record<string, number> = {
        MINIMAL: 1, LOW: 2, MODERATE: 3, HIGH: 4, CRITICAL: 5,
      };
      const numericSeverities = updatedEntries
        .map((e) => e.severityLevel ? severityToNum[e.severityLevel] ?? 0 : 0)
        .filter((s) => s > 0);
      const avgSeverity = numericSeverities.length > 0
        ? numericSeverities.reduce((a, b) => a + b, 0) / numericSeverities.length
        : 0;
      const criticalCount = updatedEntries.filter(
        (e) => e.severityLevel === SeverityLevel.HIGH || e.severityLevel === SeverityLevel.CRITICAL
      ).length;

      await prisma.upload.update({
        where: { id: uploadId },
        data: {
          aiSummary: summaryResult.summary,
          aiTags: JSON.stringify(summaryResult.tags),
          avgSeverity: Math.round(avgSeverity * 10) / 10,
          criticalCount,
          processedEntries: entries.length,
          status: "done",
        },
      });
    } catch (summaryError) {
      console.error("Summary generation failed:", summaryError);
      const updatedEntries = await prisma.surveyEntry.findMany({
        where: { uploadId },
        select: { severityLevel: true },
      });
      const severityToNum: Record<string, number> = {
        MINIMAL: 1, LOW: 2, MODERATE: 3, HIGH: 4, CRITICAL: 5,
      };
      const numericSeverities = updatedEntries
        .map((e) => e.severityLevel ? severityToNum[e.severityLevel] ?? 0 : 0)
        .filter((s) => s > 0);
      const avgSeverity = numericSeverities.length > 0
        ? numericSeverities.reduce((a, b) => a + b, 0) / numericSeverities.length
        : 0;
      const criticalCount = updatedEntries.filter(
        (e) => e.severityLevel === SeverityLevel.HIGH || e.severityLevel === SeverityLevel.CRITICAL
      ).length;

      await prisma.upload.update({
        where: { id: uploadId },
        data: {
          aiSummary: "Analysis completed but summary generation failed. Please review entries individually.",
          aiTags: "[]",
          avgSeverity: Math.round(avgSeverity * 10) / 10,
          criticalCount,
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

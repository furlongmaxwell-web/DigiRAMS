import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deepseek } from "@/lib/ai";

const REASON_SYSTEM_PROMPT = `You are a humanitarian data analyst. Given a survey entry's data and its assigned severity level, explain in 1-2 concise sentences WHY this severity was assigned. Reference specific data points from the entry (e.g. whether they received aid, access obstacles, unsafe conditions, aid adequacy). Be direct and factual.

Respond with ONLY the reason text, no JSON wrapping, no quotes.`;

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { entryId } = await params;

  const entry = await prisma.surveyEntry.findUnique({
    where: { id: entryId },
  });

  if (!entry) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  if (entry.severityReason) {
    return NextResponse.json({ reason: entry.severityReason });
  }

  try {
    const rawData = JSON.parse(entry.rawData);

    const { text: reason } = await generateText({
      model: deepseek("deepseek-chat"),
      system: REASON_SYSTEM_PROMPT,
      prompt: `Severity level: ${entry.severityLevel}\n\nEntry data:\n${JSON.stringify(rawData, null, 2)}`,
      temperature: 0.1,
      maxOutputTokens: 256,
    });

    const trimmed = reason.trim();

    await prisma.surveyEntry.update({
      where: { id: entryId },
      data: { severityReason: trimmed },
    });

    return NextResponse.json({ reason: trimmed });
  } catch (error) {
    console.error("Reason generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate reason" },
      { status: 500 }
    );
  }
}

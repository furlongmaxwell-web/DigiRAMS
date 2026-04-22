import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

const REASON_SYSTEM_PROMPT = `You are a humanitarian data analyst. Given a survey entry's data and its assigned severity level, explain in 1-2 concise sentences WHY this severity was assigned. Reference specific data points from the entry (e.g. whether they received aid, access obstacles, unsafe conditions, aid adequacy). Be direct and factual.

Respond with ONLY the reason text, no JSON wrapping, no quotes.`;

export async function POST(
  req: NextRequest,
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

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey || apiKey === "your-deepseek-api-key-here") {
    return NextResponse.json(
      { error: "AI not configured" },
      { status: 503 }
    );
  }

  try {
    const rawData = JSON.parse(entry.rawData);
    const userPrompt = `Severity level: ${entry.severityLevel}/5\n\nEntry data:\n${JSON.stringify(rawData, null, 2)}`;

    const response = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: REASON_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.1,
        max_tokens: 256,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    const reason: string = data.choices[0].message.content.trim();

    await prisma.surveyEntry.update({
      where: { id: entryId },
      data: { severityReason: reason },
    });

    return NextResponse.json({ reason });
  } catch (error) {
    console.error("Reason generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate reason" },
      { status: 500 }
    );
  }
}

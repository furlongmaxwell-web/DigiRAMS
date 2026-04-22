import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { analyzeUpload } from "@/lib/ai-analyzer";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { uploadId } = await req.json();
  if (!uploadId) {
    return NextResponse.json(
      { error: "uploadId is required" },
      { status: 400 }
    );
  }

  analyzeUpload(uploadId).catch((err) =>
    console.error("Re-analysis failed:", err)
  );

  return NextResponse.json({ status: "analyzing", uploadId });
}

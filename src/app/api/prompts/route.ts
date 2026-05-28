import { NextRequest, NextResponse } from "next/server";
import { getSystemPrompt } from "@/features/prompts/prompt-loader";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tool = searchParams.get("tool") || "generic";
  
  try {
    const prompt = await getSystemPrompt(tool);
    return NextResponse.json(prompt);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

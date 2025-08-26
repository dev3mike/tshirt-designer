import { NextRequest, NextResponse } from "next/server";
import { generateArtisticPrompts } from "@/lib/openai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required and must be a string" },
        { status: 400 }
      );
    }

    if (prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "Prompt cannot be empty" },
        { status: 400 }
      );
    }

    if (prompt.length > 500) {
      return NextResponse.json(
        { error: "Prompt is too long (max 500 characters)" },
        { status: 400 }
      );
    }

    const prompts = await generateArtisticPrompts(prompt.trim());

    return NextResponse.json({
      success: true,
      prompts,
    });
  } catch (error) {
    console.error("Error in generate-prompts API:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to generate prompts",
      },
      { status: 500 }
    );
  }
}

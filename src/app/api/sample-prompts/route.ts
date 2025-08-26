import { NextResponse } from "next/server";
import { generateSamplePrompts } from "@/lib/openai";

export async function GET() {
  try {
    const prompts = await generateSamplePrompts();

    return NextResponse.json({
      success: true,
      prompts,
    });
  } catch (error) {
    console.error("Error in sample-prompts API:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate sample prompts",
      },
      { status: 500 }
    );
  }
}

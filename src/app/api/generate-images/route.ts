import { NextRequest, NextResponse } from "next/server";
import { generateImage } from "@/lib/openai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompts } = body;

    if (!prompts || !Array.isArray(prompts)) {
      return NextResponse.json(
        { error: "Prompts array is required" },
        { status: 400 }
      );
    }

    if (prompts.length === 0 || prompts.length > 12) {
      return NextResponse.json(
        { error: "Prompts array must contain 1-12 items" },
        { status: 400 }
      );
    }

    // Validate all prompts are strings
    for (const prompt of prompts) {
      if (typeof prompt !== "string" || prompt.trim().length === 0) {
        return NextResponse.json(
          { error: "All prompts must be non-empty strings" },
          { status: 400 }
        );
      }
    }

    // Generate images one by one sequentially to avoid rate limits
    const results = [];

    for (let index = 0; index < prompts.length; index++) {
      const prompt = prompts[index];

      try {
        console.log(
          `Generating image ${index + 1}/${prompts.length}: ${prompt.substring(
            0,
            50
          )}...`
        );

        const imageUrl = await generateImage(prompt);
        results.push({
          index,
          success: true,
          imageUrl,
          prompt,
        });

        // Add delay between requests to avoid rate limiting (except for the last one)
        if (index < prompts.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 second delay
        }
      } catch (error) {
        console.error(`Error generating image ${index + 1}:`, error);
        results.push({
          index,
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to generate image",
          prompt,
        });

        // Still add delay even on error to prevent rate limit cascade
        if (index < prompts.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay on error
        }
      }
    }

    // Separate successful and failed generations
    const successful = results.filter((result) => result.success);
    const failed = results.filter((result) => !result.success);

    return NextResponse.json({
      success: true,
      images: successful.map((result) => ({
        imageUrl: result.imageUrl,
        prompt: result.prompt,
        index: result.index,
      })),
      failed: failed.map((result) => ({
        prompt: result.prompt,
        index: result.index,
        error: result.error,
      })),
      totalGenerated: successful.length,
      totalFailed: failed.length,
    });
  } catch (error) {
    console.error("Error in generate-images API:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to generate images",
      },
      { status: 500 }
    );
  }
}

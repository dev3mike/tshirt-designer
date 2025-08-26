import { NextRequest } from "next/server";
import { generateImageStream } from "@/lib/openai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompts } = body;

    if (!prompts || !Array.isArray(prompts)) {
      return new Response(
        JSON.stringify({ error: "Prompts array is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (prompts.length === 0 || prompts.length > 12) {
      return new Response(
        JSON.stringify({ error: "Prompts array must contain 1-12 items" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate all prompts are strings
    for (const prompt of prompts) {
      if (typeof prompt !== "string" || prompt.trim().length === 0) {
        return new Response(
          JSON.stringify({ error: "All prompts must be non-empty strings" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Process each prompt sequentially
          for (let index = 0; index < prompts.length; index++) {
            const prompt = prompts[index];

            console.log(
              `Streaming image ${index + 1}/${
                prompts.length
              }: ${prompt.substring(0, 50)}...`
            );

            try {
              // Send start event
              const startEvent = {
                type: "image_start",
                index,
                prompt,
                totalImages: prompts.length,
              };
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(startEvent)}\n\n`)
              );

              // Generate image with streaming
              for await (const imageEvent of generateImageStream(prompt)) {
                const streamEvent = {
                  type:
                    imageEvent.type === "partial"
                      ? "image_partial"
                      : "image_complete",
                  index,
                  imageUrl: imageEvent.imageUrl,
                  prompt,
                  isComplete: imageEvent.isComplete,
                };

                // Check if controller is still open before enqueueing
                try {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify(streamEvent)}\n\n`)
                  );
                } catch (error) {
                  console.log("Controller closed, stopping stream");
                  return; // Exit early if controller is closed
                }
              }

              // Add delay between images to avoid rate limiting (except for the last one)
              if (index < prompts.length - 1) {
                await new Promise((resolve) => setTimeout(resolve, 2000));
              }
            } catch (error) {
              console.error(`Error generating image ${index + 1}:`, error);

              const errorEvent = {
                type: "image_error",
                index,
                prompt,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to generate image",
              };

              try {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`)
                );
              } catch (controllerError) {
                console.log("Controller closed, cannot send error event");
                return;
              }

              // Still add delay even on error
              if (index < prompts.length - 1) {
                await new Promise((resolve) => setTimeout(resolve, 1000));
              }
            }
          }

          // Send completion event
          const completeEvent = {
            type: "generation_complete",
            totalImages: prompts.length,
          };
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(completeEvent)}\n\n`)
          );
        } catch (error) {
          console.error("Error in streaming generation:", error);

          const errorEvent = {
            type: "generation_error",
            error:
              error instanceof Error
                ? error.message
                : "Failed to generate images",
          };
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`)
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("Error in generate-images-stream API:", error);

    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Failed to stream images",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

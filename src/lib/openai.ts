import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not set in environment variables");
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateSamplePrompts(): Promise<string[]> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Generate 6 conceptual, artistic t-shirt design prompts. Each should be:
- 5-10 words long
- Visually striking and suitable for printing
- Based on a clear metaphor or concept (e.g., growth, resilience, balance, freedom)
- Include a strong visual anchor (e.g., ladder to the moon, cracked mask revealing light)
- Diverse in style, theme, and mood
- Creative, inspiring, and original
Return only the 6 prompts, one per line, with no numbering, formatting, or extra text.`,
        },
        {
          role: "user",
          content:
            "Generate 6 inspiring t-shirt design prompts for creative users.",
        },
      ],
      temperature: 0.9,
      max_tokens: 300,
    });

    const promptsText = completion.choices[0]?.message?.content;
    if (!promptsText) {
      throw new Error("No sample prompts generated");
    }

    const prompts = promptsText
      .split("\n")
      .map((prompt) => prompt.trim())
      .filter((prompt) => prompt.length > 0)
      .slice(0, 6); // Ensure we only get 6 prompts

    if (prompts.length < 6) {
      // Fallback to hardcoded prompts if AI fails
      return [
        "A majestic lion with geometric patterns",
        "Abstract watercolor sunset",
        "Minimalist mountain landscape",
        "Retro 80s neon cityscape",
        "Hand-drawn botanical illustration",
        "Space galaxy with stars",
        "Vintage coffee cup sketch",
        "Mandala with sacred geometry",
        "Cyberpunk city silhouette",
      ];
    }

    return prompts;
  } catch (error) {
    console.error("Error generating sample prompts:", error);
    // Fallback to hardcoded prompts
    return [
      "A majestic lion with geometric patterns",
      "Abstract watercolor sunset",
      "Minimalist mountain landscape",
      "Retro 80s neon cityscape",
      "Hand-drawn botanical illustration",
      "Space galaxy with stars",
      "Vintage coffee cup sketch",
      "Mandala with sacred geometry",
      "Cyberpunk city silhouette",
    ];
  }
}

export async function generateArtisticPrompts(
  userPrompt: string
): Promise<string[]> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert t-shirt design prompt generator. Generate 12 unique, artistic, and creative prompts for t-shirt designs that are ready to print. Each prompt must be:
- Highly specific and richly detailed
- Visually striking with a strong central visual anchor
- Distinct in style, theme, and artistic approach
- Optimized for t-shirt printing (flat colors, limited background, bold composition, fabric-friendly)
- Exclusively intended for adult fashion (absolutely no kid-oriented, childish, or cartoonish designs)
- Conceptually creative, artistic, and professional
- Digital art style suitable for print
Return exactly 12 prompts, one per line, without numbering, commentary, or additional text.`,
        },
        {
          role: "user",
          content: `Based on this user idea: "${userPrompt}", generate 12 artistic t-shirt design prompts that are ready to print.`,
        },
      ],
      temperature: 0.8,
      max_tokens: 1000,
    });

    const promptsText = completion.choices[0]?.message?.content;
    if (!promptsText) {
      throw new Error("No prompts generated");
    }

    const prompts = promptsText
      .split("\n")
      .map((prompt) => prompt.trim())
      .filter((prompt) => prompt.length > 0)
      .slice(0, 12); // Ensure we only get 12 prompts

    if (prompts.length < 12) {
      throw new Error("Failed to generate 12 prompts");
    }

    return prompts;
  } catch (error) {
    console.error("Error generating prompts:", error);
    throw error;
  }
}

export async function generateImage(prompt: string): Promise<string> {
  try {
    const fullPrompt = `A black t-shirt hanging perfectly centered against a plain, neutral background. The t-shirt is shown in a front-facing view, slightly draped on a hanger for realism. On the shirt is a bold, high-contrast digital art design: ${prompt}. The design is clean, sharp, and highly detailed, optimized for printing on fabric. The design should be centered on the chest area, vividly visible against the black fabric with crisp edges. Lighting is soft and even, with no harsh shadows or distractions, ensuring the focus remains on the shirt and the printed artwork. The overall style is professional product photography combined with digital mockup aesthetics, consistent across all images for uniformity."`;

    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt: fullPrompt,
    });

    const imageBase64 = result.data?.[0]?.b64_json;
    if (!imageBase64) {
      throw new Error("No image generated");
    }

    // Convert base64 to data URL for frontend display
    const imageDataUrl = `data:image/png;base64,${imageBase64}`;
    return imageDataUrl;
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
}

export async function* generateImageStream(prompt: string) {
  try {
    const fullPrompt = `T-shirt design: ${prompt}. High-quality, clean, high-contrast artwork suitable for printing on fabric. Centered composition. Transparent background only, no borders or extra elements.`;

    const stream = await openai.images.generate({
      model: "gpt-image-1",
      prompt: fullPrompt,
      stream: true,
      partial_images: 3,
    });

    for await (const event of stream) {
      if (event.type === "image_generation.partial_image") {
        const imageBase64 = event.b64_json;
        const imageDataUrl = `data:image/png;base64,${imageBase64}`;

        yield {
          type: "partial",
          imageUrl: imageDataUrl,
          isComplete: false,
        };
      } else if (event.type === "image_generation.completed") {
        const imageBase64 = (event as any).b64_json;
        const imageDataUrl = `data:image/png;base64,${imageBase64}`;

        yield {
          type: "complete",
          imageUrl: imageDataUrl,
          isComplete: true,
        };
      }
    }
  } catch (error) {
    console.error("Error generating image stream:", error);
    throw error;
  }
}

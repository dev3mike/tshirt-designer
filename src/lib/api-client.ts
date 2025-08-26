import {
  GeneratePromptsResponse,
  GenerateImagesResponse,
  StreamImageEvent,
} from "./types";

export class APIError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "APIError";
  }
}

export async function generatePrompts(
  prompt: string,
  signal?: AbortSignal
): Promise<string[]> {
  try {
    const response = await fetch("/api/generate-prompts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
      signal,
    });

    const data: GeneratePromptsResponse = await response.json();

    if (!response.ok) {
      throw new APIError(
        data.error || "Failed to generate prompts",
        response.status
      );
    }

    if (!data.success || !data.prompts) {
      throw new APIError(data.error || "Invalid response from server");
    }

    return data.prompts;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError("Network error while generating prompts");
  }
}

export async function generateImages(
  prompts: string[],
  signal?: AbortSignal
): Promise<GenerateImagesResponse> {
  try {
    const response = await fetch("/api/generate-images", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompts }),
      signal,
    });

    const data: GenerateImagesResponse = await response.json();

    if (!response.ok) {
      throw new APIError(
        data.error || "Failed to generate images",
        response.status
      );
    }

    if (!data.success) {
      throw new APIError(data.error || "Invalid response from server");
    }

    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError("Network error while generating images");
  }
}

export async function getSamplePrompts(): Promise<string[]> {
  try {
    const response = await fetch("/api/sample-prompts", {
      method: "GET",
    });

    const data: GeneratePromptsResponse = await response.json();

    if (!response.ok) {
      throw new APIError(
        data.error || "Failed to get sample prompts",
        response.status
      );
    }

    if (!data.success || !data.prompts) {
      throw new APIError(data.error || "Invalid response from server");
    }

    return data.prompts;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError("Network error while getting sample prompts");
  }
}

export async function* streamGenerateImages(
  prompts: string[],
  signal?: AbortSignal
): AsyncGenerator<StreamImageEvent, void, unknown> {
  try {
    const response = await fetch("/api/generate-images-stream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompts }),
      signal,
    });

    if (!response.ok) {
      throw new APIError(
        `HTTP error! status: ${response.status}`,
        response.status
      );
    }

    if (!response.body) {
      throw new APIError("No response body");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              yield data as StreamImageEvent;
            } catch (parseError) {
              console.error("Error parsing SSE data:", parseError);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    // Check if it's an abort error
    if (error instanceof DOMException && error.name === "AbortError") {
      console.log("Stream aborted by user");
      return; // Don't throw error for user-initiated aborts
    }
    throw new APIError("Network error while streaming images");
  }
}

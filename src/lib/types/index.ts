// Common types for the AI T-Shirt Designer application

export interface Design {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  prompt: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TShirtConfig {
  color: string;
  size: "XS" | "S" | "M" | "L" | "XL" | "XXL";
  style: "crew-neck" | "v-neck" | "long-sleeve";
}

export interface AIGenerationRequest {
  prompt: string;
  style?: string;
  color?: string;
  theme?: string;
}

export interface GeneratedImage {
  imageUrl: string;
  prompt: string;
  index: number;
}

export interface FailedImage {
  prompt: string;
  index: number;
  error: string;
}

export interface GeneratePromptsResponse {
  success: boolean;
  prompts?: string[];
  error?: string;
}

export interface GenerateImagesResponse {
  success: boolean;
  images?: GeneratedImage[];
  failed?: FailedImage[];
  totalGenerated?: number;
  totalFailed?: number;
  error?: string;
}

export interface StreamImageEvent {
  type:
    | "image_start"
    | "image_partial"
    | "image_complete"
    | "image_error"
    | "generation_complete"
    | "generation_error";
  index?: number;
  imageUrl?: string;
  prompt?: string;
  isComplete?: boolean;
  error?: string;
  totalImages?: number;
}

export type Theme = "light" | "dark" | "system";

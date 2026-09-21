export type TryOnCategory = "tops" | "bottoms" | "one-pieces" | "lehengas" | "sarees" | "suits";

export type TryOnStatus = "pending" | "processing" | "completed" | "failed";

export type TryOnRequest = {
  modelImageUrl: string; // User's photo (URL or base64 data URI)
  garmentImageUrl: string; // Clothing image URL
  category?: TryOnCategory | string;
  garmentDescription?: string;
  coverFeet?: boolean;
  adjustHands?: boolean;
  mode?: "performance" | "quality";
};

export type TryOnResult = {
  success: boolean;
  resultImageUrl?: string;
  provider: string;
  tryOnId: string;
  processingTimeMs: number;
  stylingNote?: string;
  error?: string;
};

export interface IVirtualTryOnProvider {
  readonly name: string;
  isAvailable(): boolean;
  generateTryOn(request: TryOnRequest): Promise<TryOnResult>;
}

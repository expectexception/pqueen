import { IVirtualTryOnProvider, TryOnRequest, TryOnResult } from "../types";

export class FalAIProvider implements IVirtualTryOnProvider {
  readonly name = "fal-ai-idm-vton";

  isAvailable(): boolean {
    return Boolean(process.env.FAL_KEY);
  }

  async generateTryOn(request: TryOnRequest): Promise<TryOnResult> {
    const apiKey = process.env.FAL_KEY;
    if (!apiKey) {
      throw new Error("Fal.ai API key is missing. Set FAL_KEY in .env");
    }

    const startTime = Date.now();

    let category = "upper_body";
    if (request.category) {
      const lower = request.category.toLowerCase();
      if (lower.includes("bottom") || lower.includes("skirt")) {
        category = "lower_body";
      } else if (lower.includes("lehenga") || lower.includes("dress") || lower.includes("suit") || lower.includes("saree") || lower.includes("one-piece")) {
        category = "dresses";
      }
    }

    const res = await fetch("https://fal.run/fal-ai/idm-vton", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${apiKey}`,
      },
      body: JSON.stringify({
        human_image_url: request.modelImageUrl,
        garment_image_url: request.garmentImageUrl,
        description: request.garmentDescription || "Haute couture outfit",
        category,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Fal.ai try-on failed: ${errText}`);
    }

    const data = await res.json();
    const resultImageUrl = data.image?.url || (data.images && data.images[0]?.url);

    if (!resultImageUrl) {
      throw new Error("No output image returned by Fal.ai.");
    }

    return {
      success: true,
      resultImageUrl,
      provider: this.name,
      tryOnId: `fal-${Date.now()}`,
      processingTimeMs: Date.now() - startTime,
    };
  }
}

import { IVirtualTryOnProvider, TryOnRequest, TryOnResult } from "../types";

export class FashnAIProvider implements IVirtualTryOnProvider {
  readonly name = "fashn-ai";

  isAvailable(): boolean {
    return Boolean(process.env.FASHN_AI_API_KEY);
  }

  async generateTryOn(request: TryOnRequest): Promise<TryOnResult> {
    const apiKey = process.env.FASHN_AI_API_KEY;
    if (!apiKey) {
      throw new Error("Fashn.ai API key is missing. Set FASHN_AI_API_KEY in .env");
    }

    const startTime = Date.now();

    // Map category
    let category = "one-pieces";
    if (request.category) {
      const lower = request.category.toLowerCase();
      if (lower.includes("top") || lower.includes("blouse") || lower.includes("choli")) {
        category = "tops";
      } else if (lower.includes("skirt") || lower.includes("pant") || lower.includes("bottom")) {
        category = "bottoms";
      } else {
        category = "one-pieces";
      }
    }

    // Step 1: Initiate try-on job
    const runRes = await fetch("https://api.fashn.ai/v1/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model_image: request.modelImageUrl,
        garment_image: request.garmentImageUrl,
        category,
        mode: request.mode || "quality",
        nsfw_filter: true,
        adjust_hands: request.adjustHands ?? true,
      }),
    });

    if (!runRes.ok) {
      const errText = await runRes.text();
      throw new Error(`Fashn.ai generation failed: ${errText}`);
    }

    const runData = await runRes.json();
    const predictionId = runData.id;

    if (!predictionId) {
      throw new Error("Fashn.ai did not return a prediction ID.");
    }

    // Step 2: Poll for completion
    let attempts = 0;
    const maxAttempts = 30; // 60 seconds maximum

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      attempts++;

      const statusRes = await fetch(`https://api.fashn.ai/v1/status/${predictionId}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (!statusRes.ok) continue;

      const statusData = await statusRes.json();

      if (statusData.status === "completed" && statusData.output && statusData.output.length > 0) {
        return {
          success: true,
          resultImageUrl: statusData.output[0],
          provider: this.name,
          tryOnId: predictionId,
          processingTimeMs: Date.now() - startTime,
        };
      }

      if (statusData.status === "failed") {
        throw new Error(statusData.error?.message || "Fashn.ai processing failed.");
      }
    }

    throw new Error("Fashn.ai try-on generation timed out.");
  }
}

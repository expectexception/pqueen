import { IVirtualTryOnProvider, TryOnRequest, TryOnResult } from "../types";

export class ReplicateProvider implements IVirtualTryOnProvider {
  readonly name = "replicate-idm-vton";

  isAvailable(): boolean {
    return Boolean(process.env.REPLICATE_API_TOKEN);
  }

  async generateTryOn(request: TryOnRequest): Promise<TryOnResult> {
    const apiToken = process.env.REPLICATE_API_TOKEN;
    if (!apiToken) {
      throw new Error("Replicate API token is missing. Set REPLICATE_API_TOKEN in .env");
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

    const initRes = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify({
        version: "c871bb9b046607b680449ecbae55fd8c6d945e0a1948644bf2361b3d021d3ff4",
        input: {
          human_img: request.modelImageUrl,
          garm_img: request.garmentImageUrl,
          garment_des: request.garmentDescription || "Luxury Party Wear",
          category,
          crop: false,
        },
      }),
    });

    if (!initRes.ok) {
      const errText = await initRes.text();
      throw new Error(`Replicate try-on failed: ${errText}`);
    }

    const initData = await initRes.json();
    const predictionId = initData.id;

    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      await new Promise((r) => setTimeout(r, 2000));
      attempts++;

      const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      });

      if (!pollRes.ok) continue;

      const pollData = await pollRes.json();

      if (pollData.status === "succeeded" && pollData.output) {
        const resultImageUrl = Array.isArray(pollData.output) ? pollData.output[0] : pollData.output;
        return {
          success: true,
          resultImageUrl,
          provider: this.name,
          tryOnId: predictionId,
          processingTimeMs: Date.now() - startTime,
        };
      }

      if (pollData.status === "failed") {
        throw new Error(pollData.error || "Replicate prediction failed.");
      }
    }

    throw new Error("Replicate try-on prediction timed out.");
  }
}

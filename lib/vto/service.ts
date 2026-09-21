import { IVirtualTryOnProvider, TryOnRequest, TryOnResult } from "./types";
import { GeminiAIProvider } from "./providers/gemini";
import { MetaAIProvider } from "./providers/meta";
import { FashnAIProvider } from "./providers/fashn";
import { FalAIProvider } from "./providers/fal";
import { ReplicateProvider } from "./providers/replicate";
import { SimulationProvider } from "./providers/simulation";
import { appConfig } from "@/lib/config";

export class VirtualTryOnService {
  private static instance: VirtualTryOnService;
  private providers: IVirtualTryOnProvider[] = [];
  private fallbackProvider: SimulationProvider;

  private constructor() {
    this.fallbackProvider = new SimulationProvider();

    // Register active providers (Google Gemini AI is #1 primary)
    this.providers = [
      new GeminiAIProvider(),
      new MetaAIProvider(),
      new FashnAIProvider(),
      new FalAIProvider(),
      new ReplicateProvider(),
    ];
  }

  public static getInstance(): VirtualTryOnService {
    if (!VirtualTryOnService.instance) {
      VirtualTryOnService.instance = new VirtualTryOnService();
    }
    return VirtualTryOnService.instance;
  }

  /**
   * Dispatches try-on request to the active Meta AI / cloud provider,
   * with automatic fallback if network fails.
   */
  public async processTryOn(request: TryOnRequest): Promise<TryOnResult> {
    const activeProvider = this.providers.find((p) => p.isAvailable());

    if (activeProvider) {
      try {
        console.log(`[VTO Service] Executing try-on with provider: ${activeProvider.name}`);
        return await activeProvider.generateTryOn(request);
      } catch (err: any) {
        console.warn(`[VTO Service] Primary provider ${activeProvider.name} failed: ${err.message}. Falling back to simulation.`);
      }
    }

    // Default or Fallback
    console.log(`[VTO Service] Using fallback provider: ${this.fallbackProvider.name}`);
    return await this.fallbackProvider.generateTryOn(request);
  }
}

export const virtualTryOnService = VirtualTryOnService.getInstance();

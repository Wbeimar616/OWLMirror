"use server";

import {
  optimizeSharingParameters,
  type OptimizeSharingParametersInput,
  type OptimizeSharingParametersOutput,
} from "@/ai/flows/optimize-sharing-parameters";

class AiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiError";
  }
}

export async function getOptimizedParameters(
  input: OptimizeSharingParametersInput
): Promise<{ data: OptimizeSharingParametersOutput | null; error: string | null }> {
  try {
    const result = await optimizeSharingParameters(input);
    if (!result.optimizedCompression || !result.optimizedFramerate) {
        throw new AiError("AI failed to return optimized parameters. Please try again.");
    }
    return { data: result, error: null };
  } catch (e: any) {
    console.error("Error optimizing parameters:", e);
    return { data: null, error: e.message || "An unexpected error occurred." };
  }
}

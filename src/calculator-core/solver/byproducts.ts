import type { RecipeOutput } from "../types";

export function calculateByproductRate(params: {
  targetRatePerMinute: number;
  primaryOutput: RecipeOutput;
  byproduct: RecipeOutput;
}): number {
  const primaryUnits = params.primaryOutput.count * params.primaryOutput.chance;
  if (primaryUnits <= 0) {
    return 0;
  }

  const recipeRunsPerMinute = params.targetRatePerMinute / primaryUnits;
  return recipeRunsPerMinute * params.byproduct.count * params.byproduct.chance;
}

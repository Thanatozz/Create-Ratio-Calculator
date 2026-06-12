import type { RecipeDefinition, RecipeOutput } from "../types";

export function getPrimaryOutput(
  recipe: RecipeDefinition,
  targetItemId?: string
): RecipeOutput {
  const output =
    recipe.outputs.find((candidate) => candidate.itemId === targetItemId) ??
    recipe.outputs[0];

  if (!output) {
    throw new Error(`Recipe ${recipe.id} has no outputs.`);
  }

  return output;
}

export function getOutputUnitsPerCycle(output: RecipeOutput): number {
  return output.count * output.chance;
}

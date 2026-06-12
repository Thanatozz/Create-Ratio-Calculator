import type { RecipeDefinition } from "../types";

export function getCraftableItemIds(recipes: RecipeDefinition[]): Set<string> {
  return new Set(
    recipes.flatMap((recipe) => recipe.outputs.map((output) => output.itemId))
  );
}

import type { RecipeDefinition } from "../types";

export function findRecipeForOutput(
  itemId: string,
  recipes: RecipeDefinition[]
): RecipeDefinition | undefined {
  return recipes.find((recipe) =>
    recipe.outputs.some((output) => output.itemId === itemId)
  );
}

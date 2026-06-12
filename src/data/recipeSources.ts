import type {
  NormalizedRecipe,
  RecipeDefinition,
  RecipeSource
} from "../calculator-core/types";
import { recipes as createBaseRecipes } from "./create-1.21.1/recipes";
import { generatedRecipeSources } from "./generated/recipeSources.generated";

export const CREATE_BASE_SOURCE_ID = "create_base";

function splitRecipeId(id: string): { namespace: string; path: string } {
  const [namespace = "unknown", ...pathParts] = id.split(":");
  return {
    namespace,
    path: pathParts.join(":") || id
  };
}

function recipeDefinitionToNormalized(recipe: RecipeDefinition): NormalizedRecipe {
  const { namespace, path } = splitRecipeId(recipe.id);

  return {
    id: recipe.id,
    sourceId: CREATE_BASE_SOURCE_ID,
    namespace,
    path,
    type: recipe.type,
    inputs: recipe.input.map((input) => ({
      itemId: input.itemId,
      count: input.count,
      raw: input
    })),
    outputs: recipe.outputs.map((output) => ({
      itemId: output.itemId,
      count: output.count,
      chance: output.chance,
      raw: output
    })),
    processingTimeTicks: recipe.processingTimeTicks,
    machineId: recipe.machineId,
    heatRequirement: recipe.requiredHeat ?? "none",
    raw: recipe,
    supported: true
  };
}

function normalizedToRecipeDefinition(
  recipe: NormalizedRecipe,
  source: RecipeSource
): RecipeDefinition | undefined {
  if (!recipe.supported || !recipe.machineId) {
    return undefined;
  }

  const outputs = recipe.outputs
    .filter((output) => output.itemId)
    .map((output) => ({
      itemId: output.itemId!,
      count: output.count,
      chance: output.chance
    }));

  if (outputs.length === 0) {
    return undefined;
  }

  return {
    id: recipe.id,
    type: recipe.type,
    category: recipe.type.split(":").pop() ?? recipe.type,
    input: recipe.inputs.map((input) => ({
      itemId: input.itemId ?? `#${input.tag ?? "unknown"}`,
      count: input.count
    })),
    outputs,
    processingTimeTicks: recipe.processingTimeTicks ?? 100,
    machineId: recipe.machineId,
    sourceId: source.id,
    sourceName: source.displayName,
    requiredHeat:
      recipe.heatRequirement === "heated" || recipe.heatRequirement === "superheated"
        ? recipe.heatRequirement
        : undefined,
    notes: recipe.unsupportedReason
  };
}

export const createBaseRecipeSource: RecipeSource = {
  id: CREATE_BASE_SOURCE_ID,
  displayName: "Create Base",
  defaultEnabled: true,
  alwaysEnabled: true,
  recipeCount: createBaseRecipes.length,
  supportedRecipeCount: createBaseRecipes.length,
  unsupportedRecipeCount: 0,
  tagCount: 0,
  recipes: createBaseRecipes.map(recipeDefinitionToNormalized),
  tags: []
};

export const allRecipeSources: RecipeSource[] = [
  createBaseRecipeSource,
  ...generatedRecipeSources
];

export function normalizeEnabledRecipeSourceIds(
  sourceIds: string[],
  sources: RecipeSource[] = allRecipeSources
): string[] {
  const knownSourceIds = new Set(sources.map((source) => source.id));
  const enabled = new Set(
    sourceIds.filter((sourceId) => knownSourceIds.has(sourceId))
  );

  enabled.add(CREATE_BASE_SOURCE_ID);
  return [...enabled];
}

export function defaultEnabledRecipeSourceIds(): string[] {
  return normalizeEnabledRecipeSourceIds(
    allRecipeSources
      .filter((source) => source.defaultEnabled || source.alwaysEnabled)
      .map((source) => source.id),
    allRecipeSources
  );
}

export function getRecipeDefinitionsFromEnabledSources(
  enabledSourceIds: string[],
  sources: RecipeSource[] = allRecipeSources
): RecipeDefinition[] {
  const enabled = new Set(normalizeEnabledRecipeSourceIds(enabledSourceIds, sources));

  return sources.flatMap((source) => {
    if (source.alwaysEnabled || enabled.has(source.id)) {
      if (source.id === CREATE_BASE_SOURCE_ID) {
        return createBaseRecipes.map((recipe) => ({
          ...recipe,
          sourceId: CREATE_BASE_SOURCE_ID,
          sourceName: "Create Base"
        }));
      }

      return source.recipes
        .map((recipe) => normalizedToRecipeDefinition(recipe, source))
        .filter((recipe): recipe is RecipeDefinition => Boolean(recipe));
    }

    return [];
  });
}

export function getRecipesByType(sources: RecipeSource[] = allRecipeSources) {
  return sources.reduce<Record<string, number>>((acc, source) => {
    for (const recipe of source.recipes) {
      acc[recipe.type] = (acc[recipe.type] ?? 0) + 1;
    }
    return acc;
  }, {});
}

export function getRecipesBySource(sources: RecipeSource[] = allRecipeSources) {
  return sources.reduce<Record<string, number>>((acc, source) => {
    acc[source.displayName] = source.recipeCount;
    return acc;
  }, {});
}

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

// The real "Create" mod is shipped as one of the scanned sources. We fold it
// into the locked base so there is a single canonical "Create" base instead of
// a curated MVP placeholder plus a duplicate "Create" addon entry.
const REAL_CREATE_SOURCE_ID = "create";

const realCreateSource = generatedRecipeSources.find(
  (source) => source.id === REAL_CREATE_SOURCE_ID
);

// Curated MVP recipes power the solver's special handling (e.g. the cobblestone
// generator drill and the default crushing/cobblestone scenario) that the real
// Create export does not contain, so they take precedence on id collisions.
const mvpBaseDefinitions: RecipeDefinition[] = createBaseRecipes.map((recipe) => ({
  ...recipe,
  sourceId: CREATE_BASE_SOURCE_ID,
  sourceName: "Create"
}));

const mvpBaseIds = new Set(mvpBaseDefinitions.map((recipe) => recipe.id));

const realCreateDefinitions: RecipeDefinition[] = realCreateSource
  ? realCreateSource.recipes
      .map((recipe) => normalizedToRecipeDefinition(recipe, realCreateSource))
      .filter((recipe): recipe is RecipeDefinition => Boolean(recipe))
      .filter((recipe) => !mvpBaseIds.has(recipe.id))
      .map((recipe) => ({
        ...recipe,
        sourceId: CREATE_BASE_SOURCE_ID,
        sourceName: "Create"
      }))
  : [];

/** The full set of recipes that make up the locked "Create" base. */
export const createBaseRecipeDefinitions: RecipeDefinition[] = [
  ...mvpBaseDefinitions,
  ...realCreateDefinitions
];

export const createBaseRecipeSource: RecipeSource = {
  id: CREATE_BASE_SOURCE_ID,
  displayName: "Create",
  version: realCreateSource?.version,
  defaultEnabled: true,
  alwaysEnabled: true,
  recipeCount: createBaseRecipeDefinitions.length,
  supportedRecipeCount: createBaseRecipeDefinitions.length,
  unsupportedRecipeCount: 0,
  tagCount: realCreateSource?.tagCount ?? 0,
  recipes: [
    ...createBaseRecipes.map(recipeDefinitionToNormalized),
    ...(realCreateSource
      ? realCreateSource.recipes.filter((recipe) => !mvpBaseIds.has(recipe.id))
      : [])
  ],
  tags: realCreateSource?.tags ?? []
};

export const allRecipeSources: RecipeSource[] = [
  createBaseRecipeSource,
  ...generatedRecipeSources.filter(
    (source) => source.id !== REAL_CREATE_SOURCE_ID
  )
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
        return createBaseRecipeDefinitions;
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

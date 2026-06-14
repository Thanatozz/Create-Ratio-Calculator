import type { RecipeDefinition, RecipeSource } from "../calculator-core/types";
import {
  cleanSourceDisplayName,
  humanizeSourceId
} from "../components/ui/displayName";
import { items as baseItems } from "./create-1.21.1/items";
import {
  allRecipeSources,
  CREATE_BASE_SOURCE_ID,
  getRecipeDefinitionsFromEnabledSources,
  normalizeEnabledRecipeSourceIds
} from "./recipeSources";

export interface TargetItemEntry {
  itemId: string;
  /** Recipe-source ids that can produce this item. */
  sourceIds: string[];
  fromCreateBase: boolean;
}

export interface RegistryStats {
  totalSources: number;
  enabledSources: number;
  activeRecipeCount: number;
  activeTargetItemCount: number;
  recipesPerSource: Record<string, number>;
  invalidRecipeIds: string[];
}

export interface ActiveRegistry {
  enabledSignature: string;
  recipes: RecipeDefinition[];
  recipesByOutput: Map<string, RecipeDefinition[]>;
  targetItems: TargetItemEntry[];
  stats: RegistryStats;
}

const sourceNameById = new Map(
  allRecipeSources.map(
    (source) => [source.id, cleanSourceDisplayName(source.displayName)] as const
  )
);

/** Resolve a recipe-source id to a clean display name, with a safe fallback. */
export function getSourceDisplayName(sourceId: string): string {
  return sourceNameById.get(sourceId) || humanizeSourceId(sourceId);
}

/** A recipe id that looks synthetic/malformed and should be hidden from users. */
function isInvalidRecipeId(id: string): boolean {
  return (
    id.includes("->") ||
    /\b\d+\.\d+(?:\.\d+)?\b\s*$/.test(id) ||
    id.split(":").length > 3
  );
}

function signatureForEnabled(enabledSourceIds: string[]): string {
  return [...normalizeEnabledRecipeSourceIds(enabledSourceIds)].sort().join(",");
}

/**
 * Build the active registry from scratch (no caching). Accepts an optional
 * source list to make the behaviour testable in isolation.
 */
export function buildRegistry(
  enabledSourceIds: string[],
  sources: RecipeSource[] = allRecipeSources
): ActiveRegistry {
  const enabledSignature = signatureForEnabled(enabledSourceIds);
  const recipes = getRecipeDefinitionsFromEnabledSources(enabledSourceIds, sources);

  const recipesByOutput = new Map<string, RecipeDefinition[]>();
  const targetItemMap = new Map<string, TargetItemEntry>();
  const recipesPerSource: Record<string, number> = {};
  const invalidRecipeIds = new Set<string>();

  // Curated base items are always selectable (covers raw inputs like Gravel).
  for (const item of baseItems) {
    targetItemMap.set(item.id, {
      itemId: item.id,
      sourceIds: [CREATE_BASE_SOURCE_ID],
      fromCreateBase: true
    });
  }

  for (const recipe of recipes) {
    const sourceId = recipe.sourceId ?? CREATE_BASE_SOURCE_ID;
    recipesPerSource[sourceId] = (recipesPerSource[sourceId] ?? 0) + 1;

    if (isInvalidRecipeId(recipe.id)) {
      invalidRecipeIds.add(recipe.id);
    }

    for (const output of recipe.outputs) {
      if (!output.itemId) {
        continue;
      }

      const existingByOutput = recipesByOutput.get(output.itemId);
      if (existingByOutput) {
        existingByOutput.push(recipe);
      } else {
        recipesByOutput.set(output.itemId, [recipe]);
      }

      const entry = targetItemMap.get(output.itemId);
      if (entry) {
        if (!entry.sourceIds.includes(sourceId)) {
          entry.sourceIds.push(sourceId);
        }
        entry.fromCreateBase =
          entry.fromCreateBase || sourceId === CREATE_BASE_SOURCE_ID;
      } else {
        targetItemMap.set(output.itemId, {
          itemId: output.itemId,
          sourceIds: [sourceId],
          fromCreateBase: sourceId === CREATE_BASE_SOURCE_ID
        });
      }
    }
  }

  const targetItems = [...targetItemMap.values()].sort((a, b) =>
    a.itemId.localeCompare(b.itemId)
  );

  const enabledSet = new Set(
    normalizeEnabledRecipeSourceIds(enabledSourceIds, sources)
  );

  return {
    enabledSignature,
    recipes,
    recipesByOutput,
    targetItems,
    stats: {
      totalSources: sources.length,
      enabledSources: enabledSet.size,
      activeRecipeCount: recipes.length,
      activeTargetItemCount: targetItems.length,
      recipesPerSource,
      invalidRecipeIds: [...invalidRecipeIds]
    }
  };
}

let cache: ActiveRegistry | undefined;

/**
 * Return the active recipe registry for the given enabled sources. The result
 * is memoised by the enabled-source signature so toggling addons or re-rendering
 * does not recompute the (potentially large) registry on every call.
 */
export function getActiveRegistry(enabledSourceIds: string[]): ActiveRegistry {
  const signature = signatureForEnabled(enabledSourceIds);
  if (cache && cache.enabledSignature === signature) {
    return cache;
  }

  cache = buildRegistry(enabledSourceIds);
  return cache;
}

/** Force the next getActiveRegistry call to rebuild (used by "Apply Addons"). */
export function invalidateRegistryCache(): void {
  cache = undefined;
}

/** Whether an item can be produced under the given enabled sources. */
export function targetItemExists(
  itemId: string,
  enabledSourceIds: string[]
): boolean {
  return getActiveRegistry(enabledSourceIds).targetItems.some(
    (entry) => entry.itemId === itemId
  );
}

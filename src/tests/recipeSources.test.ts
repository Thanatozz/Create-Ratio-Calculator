import { describe, expect, it } from "vitest";
import type { RecipeSource } from "../calculator-core/types";
import {
  CREATE_BASE_SOURCE_ID,
  createBaseRecipeSource,
  getRecipeDefinitionsFromEnabledSources,
  normalizeEnabledRecipeSourceIds
} from "../data/recipeSources";

const addonSource: RecipeSource = {
  id: "addon_test",
  displayName: "Addon Test",
  defaultEnabled: false,
  alwaysEnabled: false,
  recipeCount: 1,
  supportedRecipeCount: 1,
  unsupportedRecipeCount: 0,
  tagCount: 0,
  recipes: [
    {
      id: "addon_test:milling/custom_wheat",
      sourceId: "addon_test",
      namespace: "addon_test",
      path: "milling/custom_wheat",
      type: "create:milling",
      inputs: [{ itemId: "minecraft:wheat", count: 1, raw: {} }],
      outputs: [{ itemId: "addon_test:flour", count: 1, chance: 1, raw: {} }],
      processingTimeTicks: 100,
      machineId: "create:millstone",
      heatRequirement: "none",
      raw: {},
      supported: true
    }
  ],
  tags: []
};

describe("recipe sources", () => {
  it("excludes disabled addon recipes from solver recipes", () => {
    const recipes = getRecipeDefinitionsFromEnabledSources(
      [CREATE_BASE_SOURCE_ID],
      [createBaseRecipeSource, addonSource]
    );

    expect(recipes.some((recipe) => recipe.id === addonSource.recipes[0].id)).toBe(
      false
    );
  });

  it("includes enabled addon recipes in solver recipes", () => {
    const recipes = getRecipeDefinitionsFromEnabledSources(
      [CREATE_BASE_SOURCE_ID, addonSource.id],
      [createBaseRecipeSource, addonSource]
    );

    expect(recipes.some((recipe) => recipe.id === addonSource.recipes[0].id)).toBe(
      true
    );
  });

  it("keeps Create base enabled when source ids are normalized", () => {
    expect(
      normalizeEnabledRecipeSourceIds([], [createBaseRecipeSource, addonSource])
    ).toEqual([CREATE_BASE_SOURCE_ID]);
  });
});

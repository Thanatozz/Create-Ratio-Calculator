import { describe, expect, it } from "vitest";
import type { RecipeSource } from "../calculator-core/types";
import {
  allRecipeSources,
  CREATE_BASE_SOURCE_ID,
  createBaseRecipeDefinitions,
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

  it("exposes a single locked Create base at the top of the list", () => {
    expect(allRecipeSources[0].id).toBe(CREATE_BASE_SOURCE_ID);
    expect(allRecipeSources[0].displayName).toBe("Create");
    expect(allRecipeSources[0].alwaysEnabled).toBe(true);
  });

  it("removes the duplicate standalone Create mod source", () => {
    expect(allRecipeSources.some((source) => source.id === "create")).toBe(false);
  });

  it("folds the real Create mod recipes into the base", () => {
    // The curated MVP base alone is tiny; merging the real Create export makes
    // it large and keeps the MVP-only cobblestone scenario the solver relies on.
    expect(createBaseRecipeDefinitions.length).toBeGreaterThan(100);
    expect(
      createBaseRecipeDefinitions.some(
        (recipe) => recipe.id === "create:crushing/cobblestone"
      )
    ).toBe(true);
    expect(
      createBaseRecipeDefinitions.every(
        (recipe) => recipe.sourceId === CREATE_BASE_SOURCE_ID
      )
    ).toBe(true);
  });
});

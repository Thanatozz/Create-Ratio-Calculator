import { describe, expect, it } from "vitest";
import type { RecipeSource } from "../calculator-core/types";
import { CREATE_BASE_SOURCE_ID, createBaseRecipeSource } from "../data/recipeSources";
import { buildRegistry } from "../data/recipeRegistry";

const addonSource: RecipeSource = {
  id: "addon_test",
  displayName: "Addon Test",
  defaultEnabled: false,
  alwaysEnabled: false,
  recipeCount: 2,
  supportedRecipeCount: 2,
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
    },
    {
      // Also produces gravel, which Create Base produces too (multi-source item).
      id: "addon_test:crushing/gravel",
      sourceId: "addon_test",
      namespace: "addon_test",
      path: "crushing/gravel",
      type: "create:crushing",
      inputs: [{ itemId: "minecraft:cobblestone", count: 1, raw: {} }],
      outputs: [{ itemId: "minecraft:gravel", count: 1, chance: 1, raw: {} }],
      processingTimeTicks: 100,
      machineId: "create:crushing_wheel_pair",
      heatRequirement: "none",
      raw: {},
      supported: true
    }
  ],
  tags: []
};

const sources = [createBaseRecipeSource, addonSource];

describe("active recipe registry", () => {
  it("does not include disabled addon items in active target items", () => {
    const registry = buildRegistry([CREATE_BASE_SOURCE_ID], sources);
    expect(
      registry.targetItems.some((entry) => entry.itemId === "addon_test:flour")
    ).toBe(false);
  });

  it("adds enabled addon output items as target items", () => {
    const registry = buildRegistry([CREATE_BASE_SOURCE_ID, addonSource.id], sources);
    const flour = registry.targetItems.find(
      (entry) => entry.itemId === "addon_test:flour"
    );
    expect(flour).toBeDefined();
    expect(flour?.sourceIds).toContain(addonSource.id);
    expect(flour?.fromCreateBase).toBe(false);
  });

  it("tracks multi-source items under every contributing source", () => {
    const registry = buildRegistry([CREATE_BASE_SOURCE_ID, addonSource.id], sources);
    const gravel = registry.targetItems.find(
      (entry) => entry.itemId === "minecraft:gravel"
    );
    expect(gravel).toBeDefined();
    expect(gravel?.fromCreateBase).toBe(true);
    expect(gravel?.sourceIds).toContain(addonSource.id);
  });

  it("filters target items by a specific source", () => {
    const registry = buildRegistry([CREATE_BASE_SOURCE_ID, addonSource.id], sources);
    const addonOnly = registry.targetItems.filter((entry) =>
      entry.sourceIds.includes(addonSource.id)
    );
    expect(addonOnly.some((entry) => entry.itemId === "addon_test:flour")).toBe(true);
    // A pure Create Base raw item should not appear under the addon filter.
    expect(addonOnly.some((entry) => entry.itemId === "minecraft:sand")).toBe(false);
  });

  it("reports diagnostics for enabled sources", () => {
    const registry = buildRegistry([CREATE_BASE_SOURCE_ID, addonSource.id], sources);
    expect(registry.stats.totalSources).toBe(2);
    expect(registry.stats.enabledSources).toBe(2);
    expect(registry.stats.activeRecipeCount).toBeGreaterThan(0);
    expect(registry.stats.recipesPerSource[addonSource.id]).toBe(2);
  });

  it("builds a recipe-by-output lookup map", () => {
    const registry = buildRegistry([CREATE_BASE_SOURCE_ID, addonSource.id], sources);
    expect(registry.recipesByOutput.get("addon_test:flour")?.length).toBe(1);
  });
});

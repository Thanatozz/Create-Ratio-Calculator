import { describe, expect, it } from "vitest";
import { useCalculatorStore } from "../stores/calculatorStore";
import { useSettingsStore } from "../stores/settingsStore";

describe("applyRecipeSources", () => {
  it("keeps a valid target item and reports success", () => {
    useCalculatorStore.getState().setTargetItemId("minecraft:gravel");
    useCalculatorStore.getState().applyRecipeSources();

    expect(useCalculatorStore.getState().targetItemId).toBe("minecraft:gravel");
    expect(useCalculatorStore.getState().recipeSourceStatus?.kind).toBe("success");
  });

  it("resets an invalid target item after applying", () => {
    useCalculatorStore.setState({ targetItemId: "nonexistent:item_xyz" });
    useCalculatorStore.getState().applyRecipeSources();

    expect(useCalculatorStore.getState().targetItemId).not.toBe("nonexistent:item_xyz");
    expect(useCalculatorStore.getState().targetItemId).toBeTruthy();
  });

  it("records the last applied timestamp", () => {
    const before = Date.now();
    useCalculatorStore.getState().applyRecipeSources();
    const applied = useSettingsStore.getState().lastRecipeSourcesAppliedAt;

    expect(applied).toBeDefined();
    expect(applied as number).toBeGreaterThanOrEqual(before);
  });

  it("clears the status when requested", () => {
    useCalculatorStore.getState().applyRecipeSources();
    expect(useCalculatorStore.getState().recipeSourceStatus).toBeDefined();

    useCalculatorStore.getState().clearRecipeSourceStatus();
    expect(useCalculatorStore.getState().recipeSourceStatus).toBeUndefined();
  });
});

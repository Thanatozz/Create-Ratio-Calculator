import { describe, expect, it } from "vitest";
import {
  calculateCrushingWheelStackTime,
  crushingWheelCalculator
} from "../calculator-core/machines/crushingWheel";
import { machineById } from "../data/create-1.21.1/machines";
import { recipes } from "../data/create-1.21.1/recipes";
import { transportModes } from "../data/create-1.21.1/transport";

describe("crushing wheel stack processing", () => {
  it("calculates cobblestone stack time near 69 ticks", () => {
    const ticks = calculateCrushingWheelStackTime({
      processingTimeTicks: 250,
      rpm: 256,
      stackSize: 64,
      inputDelayTicks: 1
    });

    expect(ticks).toBe(69);
  });

  it("calculates cobblestone throughput near 1113 items per minute", () => {
    const recipe = recipes.find((candidate) => candidate.id === "create:crushing/cobblestone");
    expect(recipe).toBeDefined();

    const result = crushingWheelCalculator.calculateApproximateThroughput({
      recipe: recipe!,
      machine: machineById["create:crushing_wheel_pair"],
      rpm: 256,
      stackSize: 64,
      transportMode: "brass_funnel",
      transport: transportModes.brass_funnel,
      targetItemId: "minecraft:gravel",
      realisticEfficiency: 0.85
    });

    expect(result.effectiveProcessingTimeTicks).toBe(69);
    expect(result.itemsPerMinute).toBeCloseTo(1113.04, 1);
  });
});

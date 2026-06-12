import { describe, expect, it } from "vitest";
import { calculateMachineCount } from "../calculator-core/ratios/general";
import {
  calculateUtilization,
  getUtilizationStatus
} from "../calculator-core/ratios/utilization";
import { solveProduction } from "../calculator-core/solver/solveProduction";

describe("production solver", () => {
  it("rounds machine counts up", () => {
    expect(calculateMachineCount(1113, 170.67)).toBe(7);
  });

  it("classifies utilization status", () => {
    expect(getUtilizationStatus(calculateUtilization(70, 100))).toBe("comfortable");
    expect(getUtilizationStatus(calculateUtilization(90, 100))).toBe("tight");
    expect(getUtilizationStatus(calculateUtilization(98, 100))).toBe("very_tight");
    expect(getUtilizationStatus(calculateUtilization(101, 100))).toBe("bottleneck");
    expect(
      getUtilizationStatus(calculateUtilization(100, 100), { exactTarget: true })
    ).toBe("exact_target");
  });

  it("solves the Cobblestone to Gravel example", () => {
    const result = solveProduction({
      targetItemId: "minecraft:gravel",
      targetRatePerMinute: 1113,
      mode: "realistic",
      rpm: 256,
      stackSize: 64,
      transportMode: "brass_funnel",
      realisticEfficiency: 0.85,
      suMargin: 0.15
    });

    const drills = result.machines.find(
      (machine) => machine.machineId === "create:mechanical_drill"
    );
    const crusher = result.machines.find(
      (machine) => machine.machineId === "create:crushing_wheel_pair"
    );

    expect(crusher?.count).toBe(1);
    expect(drills?.count).toBe(12);
    expect(result.su.consumedSu).toBe(16384);
    expect(result.su.recommendedSu).toBe(18842);
    expect(result.rawInputs[0]?.source).toBe("generated");
    expect(
      result.warnings.some((warning) => warning.title === "Very tight machine load")
    ).toBe(false);
  });

  it("tracks byproducts from gravel crushing", () => {
    const result = solveProduction({
      targetItemId: "minecraft:sand",
      targetRatePerMinute: 1113,
      mode: "realistic",
      rpm: 256,
      stackSize: 64,
      transportMode: "brass_funnel",
      realisticEfficiency: 0.85,
      suMargin: 0.15
    });

    const flint = result.byproducts.find(
      (byproduct) => byproduct.itemId === "minecraft:flint"
    );

    expect(flint?.ratePerMinute).toBeCloseTo(278.25, 2);
  });
});

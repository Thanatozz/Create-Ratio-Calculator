import { describe, expect, it } from "vitest";
import { buildSuSummary } from "../calculator-core/su/planner";
import { calculateStressImpact } from "../calculator-core/su/stress";
import { calculateGeneratorCount } from "../calculator-core/su/generators";
import { suGenerators } from "../data/create-1.21.1/suGenerators";

describe("SU calculations", () => {
  it("calculates drill and crushing wheel SU for the example", () => {
    const drills = calculateStressImpact({
      machineCount: 12,
      stressImpactPerRpm: 4,
      rpm: 256
    });
    const crushingWheels = calculateStressImpact({
      machineCount: 1,
      blocksPerSet: 2,
      stressImpactPerRpm: 8,
      rpm: 256
    });

    expect(drills.totalSu).toBe(12288);
    expect(crushingWheels.totalSu).toBe(4096);
    expect(drills.totalSu + crushingWheels.totalSu).toBe(16384);
  });

  it("calculates generator counts", () => {
    expect(calculateGeneratorCount(18842, 256)).toBe(74);
    expect(calculateGeneratorCount(18842, 512)).toBe(37);
    expect(calculateGeneratorCount(18842, 2048)).toBe(10);
    expect(calculateGeneratorCount(18842, 16384)).toBe(2);
  });

  it("builds SU planner recommendations with margin", () => {
    const summary = buildSuSummary({
      consumedSu: 16384,
      margin: 0.15,
      generators: suGenerators
    });

    expect(summary.recommendedSu).toBe(18842);
    expect(
      summary.generatorPlans.find(
        (plan) => plan.generatorId === "create:large_water_wheel"
      )?.count
    ).toBe(37);
    expect(summary.mixedPlans[0]?.name).toContain("Active Steam Engine");
  });
});

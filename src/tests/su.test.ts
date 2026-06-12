import { describe, expect, it } from "vitest";
import { buildSuSummary } from "../calculator-core/su/planner";
import { calculateStressImpact } from "../calculator-core/su/stress";
import { calculateGeneratorCount } from "../calculator-core/su/generators";
import {
  CREATIVE_GENERATOR_ID,
  SMALL_ACTIVE_STEAM_ENGINE_ID,
  SUPERHEATED_BOILER_ID,
  getVisibleSuGenerators,
  normalSuGenerators,
  suGenerators
} from "../data/create-1.21.1/suGenerators";

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
    expect(summary.recommendedSetup?.generatorId).toBe(
      SMALL_ACTIVE_STEAM_ENGINE_ID
    );
    expect(summary.mixedPlans[0]?.name).toContain("Small Active Steam Engine");
  });

  it("uses the configured Steam Boiler setup levels and capacities", () => {
    expect(
      normalSuGenerators
        .filter((generator) => generator.name.includes("Steam Engine"))
        .map((generator) => ({
          name: generator.name,
          level: generator.level,
          suCapacity: generator.suCapacity
        }))
    ).toEqual([
      {
        name: "Passive Steam Engine",
        level: "0",
        suCapacity: 2048
      },
      {
        name: "Small Active Steam Engine",
        level: "1",
        suCapacity: 16384
      },
      {
        name: "Active Steam Engine",
        level: "4",
        suCapacity: 65536
      },
      {
        name: "Max Heated Steam Engine",
        level: "9",
        suCapacity: 147456
      },
      {
        name: "Max Superheated Steam Engine",
        level: "18",
        suCapacity: 294912
      }
    ]);
  });

  it("hides Creative Generator from normal generator options by default", () => {
    const visibleGenerators = getVisibleSuGenerators(false);

    expect(
      visibleGenerators.some((generator) => generator.id === CREATIVE_GENERATOR_ID)
    ).toBe(false);
    expect(visibleGenerators.map((generator) => generator.name)).toEqual([
      "Water Wheel",
      "Large Water Wheel",
      "Windmill Bearing",
      "Passive Steam Engine",
      "Small Active Steam Engine",
      "Active Steam Engine",
      "Max Heated Steam Engine",
      "Max Superheated Steam Engine"
    ]);
  });

  it("shows Creative Generator only when the advanced setting is enabled", () => {
    expect(
      getVisibleSuGenerators(true).some(
        (generator) => generator.id === CREATIVE_GENERATOR_ID
      )
    ).toBe(true);
  });

  it("does not recommend Creative Generator by default", () => {
    const summary = buildSuSummary({
      consumedSu: 600000,
      margin: 0,
      generators: normalSuGenerators
    });

    expect(summary.recommendedSetup?.generatorId).not.toBe(CREATIVE_GENERATOR_ID);
  });

  it("recommends multiple Max Superheated Steam Engine level 18 setups for high SU demand", () => {
    const summary = buildSuSummary({
      consumedSu: 600000,
      margin: 0,
      generators: normalSuGenerators
    });

    expect(summary.recommendedSetup?.generatorId).toBe(SUPERHEATED_BOILER_ID);
    expect(summary.recommendedSetup?.count).toBe(3);
  });
});

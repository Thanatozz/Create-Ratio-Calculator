import { describe, expect, it } from "vitest";
import {
  calculateApproximateDrillCobbleRate,
  calculateMechanicalDrillRequirements,
  calculateRealisticDrillCobbleRate
} from "../calculator-core/machines/mechanicalDrill";

describe("mechanical drill cobblestone source", () => {
  it("calculates approximate drill cobble rate", () => {
    expect(calculateApproximateDrillCobbleRate({ rpm: 256 })).toBeCloseTo(
      170.67,
      2
    );
  });

  it("uses realistic drill table at 256 RPM", () => {
    expect(calculateRealisticDrillCobbleRate(256)).toBe(109);
  });

  it("calculates approximate, realistic, and recommended drill counts", () => {
    const result = calculateMechanicalDrillRequirements({
      targetItemsPerMinute: 1113,
      rpm: 256
    });

    expect(result.approximateDrills).toBe(7);
    expect(result.realisticMinimumDrills).toBe(11);
    expect(result.recommendedDrills).toBe(12);
  });
});

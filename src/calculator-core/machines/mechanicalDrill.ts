import { DEFAULT_DRILL_SAFETY_MARGIN, SECONDS_PER_MINUTE } from "../constants";
import { calculateStress } from "../su/stress";
import type {
  MachineCalculationParams,
  MachineCalculator,
  RpmPreset,
  ThroughputResult
} from "../types";

export const realisticDrillCobbleRates: Record<RpmPreset, number> = {
  16: 20,
  32: 38,
  64: 65,
  128: 90,
  256: 109
};

export function calculateApproximateDrillCobbleRate(params: {
  rpm: number;
  blockHardness?: number;
}): number {
  const blockHardness = params.blockHardness ?? 2;
  const timeSeconds = (45 * blockHardness) / params.rpm;
  return SECONDS_PER_MINUTE / timeSeconds;
}

export function calculateRealisticDrillCobbleRate(rpm: number): number {
  const presetRate = realisticDrillCobbleRates[rpm as RpmPreset];
  if (presetRate) {
    return presetRate;
  }

  const presets = Object.keys(realisticDrillCobbleRates)
    .map(Number)
    .sort((a, b) => a - b);
  const lower = [...presets].reverse().find((preset) => preset < rpm);
  const upper = presets.find((preset) => preset > rpm);

  if (lower && upper) {
    const lowerRate = realisticDrillCobbleRates[lower as RpmPreset];
    const upperRate = realisticDrillCobbleRates[upper as RpmPreset];
    const progress = (rpm - lower) / (upper - lower);
    return lowerRate + (upperRate - lowerRate) * progress;
  }

  if (rpm < presets[0]) {
    return realisticDrillCobbleRates[16] * (rpm / 16);
  }

  return realisticDrillCobbleRates[256] * (rpm / 256) * 0.92;
}

export function calculateMechanicalDrillRequirements(params: {
  targetItemsPerMinute: number;
  rpm: number;
  safetyMargin?: number;
}): {
  approximateRatePerDrill: number;
  realisticRatePerDrill: number;
  approximateDrills: number;
  realisticMinimumDrills: number;
  recommendedDrills: number;
} {
  const approximateRatePerDrill = calculateApproximateDrillCobbleRate({
    rpm: params.rpm
  });
  const realisticRatePerDrill = calculateRealisticDrillCobbleRate(params.rpm);
  const safetyMargin = params.safetyMargin ?? DEFAULT_DRILL_SAFETY_MARGIN;

  return {
    approximateRatePerDrill,
    realisticRatePerDrill,
    approximateDrills: Math.ceil(
      params.targetItemsPerMinute / approximateRatePerDrill
    ),
    realisticMinimumDrills: Math.ceil(
      params.targetItemsPerMinute / realisticRatePerDrill
    ),
    recommendedDrills: Math.ceil(
      (params.targetItemsPerMinute * (1 + safetyMargin)) / realisticRatePerDrill
    )
  };
}

function drillThroughput(params: MachineCalculationParams, realistic: boolean): ThroughputResult {
  const itemsPerMinute = realistic
    ? calculateRealisticDrillCobbleRate(params.rpm)
    : calculateApproximateDrillCobbleRate({ rpm: params.rpm });

  return {
    itemsPerMinute,
    cyclesPerMinute: itemsPerMinute,
    effectiveProcessingTimeTicks: 1200 / itemsPerMinute,
    itemsPerCycle: 1,
    efficiency: realistic ? itemsPerMinute / calculateApproximateDrillCobbleRate({ rpm: params.rpm }) : 1,
    details: [
      {
        label: realistic ? "Realistic drill table" : "Approx drill formula",
        value: realistic
          ? `${params.rpm} RPM = ${itemsPerMinute.toFixed(2)} cobble/min`
          : `60 / ((45 * 2) / ${params.rpm}) = ${itemsPerMinute.toFixed(2)} cobble/min`
      }
    ]
  };
}

export const mechanicalDrillCalculator: MachineCalculator = {
  machineId: "create:mechanical_drill",
  calculateApproximateThroughput(params) {
    return drillThroughput(params, false);
  },
  calculateRealisticThroughput(params) {
    return drillThroughput(params, true);
  },
  calculateStress
};

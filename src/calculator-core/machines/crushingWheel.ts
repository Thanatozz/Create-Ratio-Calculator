import { TICKS_PER_MINUTE } from "../constants";
import { calculateRealisticThroughput } from "../ratios/general";
import { getPrimaryOutput } from "../recipes/normalizeRecipe";
import { calculateStress } from "../su/stress";
import type {
  MachineCalculationParams,
  MachineCalculator,
  ThroughputResult
} from "../types";

export function calculateCrushingWheelStackTime(params: {
  processingTimeTicks: number;
  rpm: number;
  stackSize: number;
  inputDelayTicks: number;
}): number {
  const safeStackSize = Math.max(2, params.stackSize);
  const effectiveSpeed = ((params.rpm / 50) * 4) / Math.log2(safeStackSize);
  return (
    Math.floor((params.processingTimeTicks - 20) / effectiveSpeed) +
    1 +
    params.inputDelayTicks
  );
}

function calculateCrushingThroughput(
  params: MachineCalculationParams,
  efficiency: number
): ThroughputResult {
  const output = getPrimaryOutput(params.recipe, params.targetItemId);
  const primaryInput = params.recipe.input[0];
  const itemStacksProcessed = params.stackSize / (primaryInput?.count ?? 1);
  const itemsPerCycle = itemStacksProcessed * output.count * output.chance;
  const effectiveProcessingTimeTicks = calculateCrushingWheelStackTime({
    processingTimeTicks: params.recipe.processingTimeTicks,
    rpm: params.rpm,
    stackSize: params.stackSize,
    inputDelayTicks: params.transport.inputDelayTicks
  });
  const cyclesPerMinute = TICKS_PER_MINUTE / effectiveProcessingTimeTicks;
  const idealThroughput = itemsPerCycle * cyclesPerMinute;
  const itemsPerMinute = calculateRealisticThroughput(idealThroughput, efficiency);

  return {
    itemsPerMinute,
    cyclesPerMinute,
    effectiveProcessingTimeTicks,
    itemsPerCycle,
    efficiency,
    details: [
      {
        label: "Effective speed",
        value: `((${params.rpm} / 50) * 4) / log2(${params.stackSize})`
      },
      {
        label: "Stack time",
        value: `floor((${params.recipe.processingTimeTicks} - 20) / speed) + 1 + ${params.transport.inputDelayTicks} = ${effectiveProcessingTimeTicks} ticks`
      },
      {
        label: "Throughput",
        value: `${itemsPerCycle.toFixed(2)} items * ${cyclesPerMinute.toFixed(2)} cycles/min * ${efficiency} = ${itemsPerMinute.toFixed(2)} items/min`
      }
    ]
  };
}

export const crushingWheelCalculator: MachineCalculator = {
  machineId: "create:crushing_wheel_pair",
  calculateApproximateThroughput(params) {
    return calculateCrushingThroughput(params, 1);
  },
  calculateRealisticThroughput(params) {
    const efficiency =
      params.machine.realisticEfficiency ??
      params.machine.defaultEfficiency ??
      params.realisticEfficiency;
    return calculateCrushingThroughput(params, efficiency);
  },
  calculateStress
};

import { TICKS_PER_MINUTE } from "../constants";
import { calculateRecipeThroughput, calculateRealisticThroughput } from "../ratios/general";
import { getPrimaryOutput } from "../recipes/normalizeRecipe";
import { calculateStress } from "../su/stress";
import type {
  MachineCalculationParams,
  MachineCalculator,
  ThroughputResult
} from "../types";

function calculateGenericThroughput(
  params: MachineCalculationParams,
  efficiency: number
): ThroughputResult {
  const output = getPrimaryOutput(params.recipe, params.targetItemId);
  const idealThroughput = calculateRecipeThroughput({
    outputCount: output.count,
    outputChance: output.chance,
    effectiveProcessingTimeTicks: params.recipe.processingTimeTicks
  });
  const itemsPerMinute = calculateRealisticThroughput(idealThroughput, efficiency);
  const cyclesPerMinute = TICKS_PER_MINUTE / params.recipe.processingTimeTicks;

  return {
    itemsPerMinute,
    cyclesPerMinute,
    effectiveProcessingTimeTicks: params.recipe.processingTimeTicks,
    itemsPerCycle: output.count * output.chance,
    efficiency,
    details: [
      {
        label: "Cycles/min",
        value: `1200 / ${params.recipe.processingTimeTicks} = ${cyclesPerMinute.toFixed(2)}`
      },
      {
        label: "Output/min",
        value: `${output.count} * ${output.chance} * ${cyclesPerMinute.toFixed(2)} * ${efficiency} = ${itemsPerMinute.toFixed(2)}`
      }
    ]
  };
}

export function createGenericMachineCalculator(machineId: string): MachineCalculator {
  return {
    machineId,
    calculateApproximateThroughput(params) {
      return calculateGenericThroughput(params, 1);
    },
    calculateRealisticThroughput(params) {
      const efficiency =
        params.machine.realisticEfficiency ??
        params.machine.defaultEfficiency ??
        params.realisticEfficiency;
      return calculateGenericThroughput(params, efficiency);
    },
    calculateStress
  };
}

import { TICKS_PER_MINUTE, TICKS_PER_SECOND } from "../constants";

export function ticksToSeconds(ticks: number): number {
  return ticks / TICKS_PER_SECOND;
}

export function ticksToMinutes(ticks: number): number {
  return ticks / TICKS_PER_MINUTE;
}

export function calculateRecipeThroughput(params: {
  outputCount: number;
  outputChance: number;
  effectiveProcessingTimeTicks: number;
}): number {
  if (params.effectiveProcessingTimeTicks <= 0) {
    return 0;
  }

  const cyclesPerMinute = TICKS_PER_MINUTE / params.effectiveProcessingTimeTicks;
  return params.outputCount * params.outputChance * cyclesPerMinute;
}

export function calculateRealisticThroughput(
  idealThroughput: number,
  efficiencyFactor: number
): number {
  return idealThroughput * efficiencyFactor;
}

export function calculateMachineCount(
  targetItemsPerMinute: number,
  machineOutputPerMinute: number
): number {
  if (targetItemsPerMinute <= 0) {
    return 0;
  }

  if (machineOutputPerMinute <= 0) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.ceil(targetItemsPerMinute / machineOutputPerMinute);
}

import type {
  MachineDefinition,
  StressCalculationParams,
  StressResult
} from "../types";

export function calculateStressImpact(params: {
  stressImpactPerRpm: number;
  rpm: number;
  machineCount: number;
  blocksPerSet?: number;
}): StressResult {
  const blockCount = params.machineCount * (params.blocksPerSet ?? 1);
  const suPerMachineSet =
    params.stressImpactPerRpm * params.rpm * (params.blocksPerSet ?? 1);

  return {
    machineCount: params.machineCount,
    blockCount,
    stressImpactPerRpm: params.stressImpactPerRpm,
    rpm: params.rpm,
    suPerMachineSet,
    totalSu: suPerMachineSet * params.machineCount
  };
}

export function calculateStress(params: StressCalculationParams): StressResult {
  return calculateStressImpact({
    stressImpactPerRpm: params.machine.stressImpactPerRpm,
    rpm: params.rpm,
    machineCount: params.machineCount,
    blocksPerSet: params.machine.blocksPerSet
  });
}

export function applyMachineStressOverrides(
  machines: MachineDefinition[],
  overrides: Record<string, number> | undefined
): MachineDefinition[] {
  if (!overrides) {
    return machines;
  }

  return machines.map((machine) => ({
    ...machine,
    stressImpactPerRpm: overrides[machine.id] ?? machine.stressImpactPerRpm
  }));
}

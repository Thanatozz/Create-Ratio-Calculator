import type { GeneratorPlan, SuGeneratorDefinition } from "../types";

export function calculateGeneratorCount(
  requiredSu: number,
  suCapacityPerGenerator: number
): number {
  if (requiredSu <= 0) {
    return 0;
  }

  if (!Number.isFinite(suCapacityPerGenerator) || suCapacityPerGenerator <= 0) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.ceil(requiredSu / suCapacityPerGenerator);
}

export function buildGeneratorPlan(
  generator: SuGeneratorDefinition,
  requiredSu: number
): GeneratorPlan {
  const count = calculateGeneratorCount(requiredSu, generator.suCapacity);
  const totalSu = count * generator.suCapacity;

  return {
    id: `plan:${generator.id}`,
    generatorId: generator.id,
    generatorName: generator.name,
    category: generator.category,
    count,
    suCapacityEach: generator.suCapacity,
    totalSu,
    surplusSu: totalSu - requiredSu
  };
}

export function applyGeneratorCapacityOverrides(
  generators: SuGeneratorDefinition[],
  overrides: Record<string, number> | undefined
): SuGeneratorDefinition[] {
  if (!overrides) {
    return generators;
  }

  return generators.map((generator) => ({
    ...generator,
    suCapacity: overrides[generator.id] ?? generator.suCapacity
  }));
}

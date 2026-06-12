import {
  DEFAULT_REALISTIC_EFFICIENCY,
  DEFAULT_SU_MARGIN
} from "../constants";
import { machineById, machines } from "../../data/create-1.21.1/machines";
import { recipes } from "../../data/create-1.21.1/recipes";
import { transportModes } from "../../data/create-1.21.1/transport";
import { getMachineCalculator } from "../machines";
import { getPrimaryOutput } from "../recipes/normalizeRecipe";
import { applyMachineStressOverrides } from "../su/stress";
import type {
  FixedMachinesRequest,
  MachineDefinition,
  ProductionSolveResult
} from "../types";
import { solveProduction } from "./solveProduction";

function indexMachines(machinesToIndex: MachineDefinition[]) {
  return machinesToIndex.reduce<Record<string, MachineDefinition>>((acc, machine) => {
    acc[machine.id] = machine;
    return acc;
  }, {});
}

export function solveFixedMachines(
  request: FixedMachinesRequest
): ProductionSolveResult {
  const configuredMachines = indexMachines(
    applyMachineStressOverrides(machines, request.machineStressOverrides)
  );
  const machine = configuredMachines[request.machineId] ?? machineById[request.machineId];
  const activeRecipes = request.recipes ?? recipes;
  const recipe = activeRecipes.find((candidate) => candidate.id === request.recipeId);

  if (!machine) {
    throw new Error(`Unknown machine: ${request.machineId}`);
  }

  if (!recipe) {
    throw new Error(`Unknown recipe: ${request.recipeId}`);
  }

  if (recipe.machineId !== request.machineId) {
    throw new Error(
      `Recipe ${recipe.id} is not processed by machine ${request.machineId}.`
    );
  }

  const primaryOutput = getPrimaryOutput(recipe);
  const calculator = getMachineCalculator(machine.id);
  const transport = transportModes[request.transportMode];
  const commonParams = {
    recipe,
    machine,
    rpm: request.rpm,
    stackSize: request.stackSize,
    transportMode: request.transportMode,
    transport,
    targetItemId: primaryOutput.itemId,
    realisticEfficiency:
      request.realisticEfficiency ?? DEFAULT_REALISTIC_EFFICIENCY
  };
  const approximate = calculator.calculateApproximateThroughput(commonParams);
  const realistic = calculator.calculateRealisticThroughput(commonParams);
  const selectedThroughput =
    request.mode === "realistic" ? realistic : approximate;

  return solveProduction({
    calculationMode: "fixed_machines",
    targetItemId: primaryOutput.itemId,
    targetRatePerMinute:
      selectedThroughput.itemsPerMinute * request.machineCount,
    mode: request.mode,
    rpm: request.rpm,
    stackSize: request.stackSize,
    transportMode: request.transportMode,
    realisticEfficiency:
      request.realisticEfficiency ?? DEFAULT_REALISTIC_EFFICIENCY,
    suMargin: request.suMargin ?? DEFAULT_SU_MARGIN,
    recipes: activeRecipes,
    suGenerators: request.suGenerators,
    machineStressOverrides: request.machineStressOverrides,
    generatorCapacityOverrides: request.generatorCapacityOverrides,
    fixedMachine: {
      machineId: request.machineId,
      recipeId: request.recipeId,
      machineCount: request.machineCount
    }
  });
}

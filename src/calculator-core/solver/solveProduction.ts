import { itemById } from "../../data/create-1.21.1/items";
import { machines } from "../../data/create-1.21.1/machines";
import { recipes as baseRecipes } from "../../data/create-1.21.1/recipes";
import { normalSuGenerators } from "../../data/create-1.21.1/suGenerators";
import { transportModes } from "../../data/create-1.21.1/transport";
import { buildGraph } from "../graph/buildGraph";
import { buildSuSummary } from "../su/planner";
import {
  applyGeneratorCapacityOverrides
} from "../su/generators";
import { applyMachineStressOverrides } from "../su/stress";
import type {
  MachineDefinition,
  SolverInput,
  SolverOutput,
  TransportDefinition
} from "../types";
import { createSolverContext, solveItem } from "./solveItem";
import { createWarning } from "./warnings";

interface SolverInputWithTransport extends SolverInput {
  transportModeData: TransportDefinition;
}

function indexMachines(machinesToIndex: MachineDefinition[]) {
  return machinesToIndex.reduce<Record<string, MachineDefinition>>((acc, machine) => {
    acc[machine.id] = machine;
    return acc;
  }, {});
}

export function solveProduction(input: SolverInput): SolverOutput {
  const configuredMachines = applyMachineStressOverrides(
    machines,
    input.machineStressOverrides
  );
  const configuredGenerators = applyGeneratorCapacityOverrides(
    input.suGenerators ?? normalSuGenerators,
    input.generatorCapacityOverrides
  );
  const transportModeData = transportModes[input.transportMode];
  const activeRecipes = input.recipes ?? baseRecipes;
  const solverInput: SolverInputWithTransport = {
    ...input,
    transportModeData
  };
  const ctx = createSolverContext({
    input: solverInput,
    recipes: activeRecipes,
    machinesById: indexMachines(configuredMachines),
    itemsById: itemById
  });

  solveItem(ctx, input.targetItemId, input.targetRatePerMinute);

  const consumedSu = ctx.machines.reduce(
    (total, machine) => total + machine.stress.totalSu,
    0
  );
  const su = buildSuSummary({
    consumedSu,
    margin: input.suMargin,
    generators: configuredGenerators
  });
  const availableSu = su.recommendedSetup?.totalSu ?? su.minimumSetup?.totalSu ?? 0;

  if (consumedSu > availableSu) {
    ctx.warnings.push(
      createWarning({
        id: `warning:su_overstressed`,
        severity: "error",
        title: "Overstressed",
        message: `Machines consume ${consumedSu.toLocaleString()} SU, but the selected generation plan provides ${availableSu.toLocaleString()} SU.`
      })
    );
  } else if (availableSu < su.recommendedSu) {
    ctx.warnings.push(
      createWarning({
        id: `warning:su_low_margin`,
        severity: "warning",
        title: "Low SU margin",
        message: `Generated SU covers the machine load but is below the configured ${Math.round(input.suMargin * 100)}% margin.`
      })
    );
  }

  const output: SolverOutput = {
    calculationMode: input.calculationMode ?? "target_output",
    target: {
      calculationMode: input.calculationMode ?? "target_output",
      targetItemId: input.targetItemId,
      targetRatePerMinute: input.targetRatePerMinute,
      mode: input.mode,
      rpm: input.rpm,
      stackSize: input.stackSize,
      transportMode: input.transportMode
    },
    fixedMachine: input.fixedMachine
      ? {
          ...input.fixedMachine,
          nodeId: ctx.machines.find(
            (machine) => machine.role === "fixed_machine"
          )?.nodeId
        }
      : undefined,
    machines: ctx.machines,
    itemFlows: ctx.itemFlows,
    rawInputs: ctx.rawInputs,
    byproducts: ctx.byproducts,
    su,
    graph: { nodes: [], edges: [] },
    warnings: ctx.warnings,
    formulaBreakdown: ctx.formulaBreakdown,
    selectedRecipe: ctx.selectedRecipe,
    missingData: ctx.missingData,
    unsupportedRecipeTypes: Array.from(new Set(ctx.unsupportedRecipeTypes))
  };

  output.graph = buildGraph(output);
  return output;
}

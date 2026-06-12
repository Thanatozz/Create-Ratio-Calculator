import { DEFAULT_DRILL_SAFETY_MARGIN } from "../constants";
import { getMachineCalculator } from "../machines";
import {
  calculateMechanicalDrillRequirements
} from "../machines/mechanicalDrill";
import { calculateMachineCount } from "../ratios/general";
import { calculateUtilization, getUtilizationStatus } from "../ratios/utilization";
import { findRecipeForOutput } from "../recipes/findRecipe";
import { getOutputUnitsPerCycle, getPrimaryOutput } from "../recipes/normalizeRecipe";
import { calculateStress } from "../su/stress";
import type {
  ByproductFlow,
  CalculatorWarning,
  FormulaDetail,
  ItemDefinition,
  ItemFlow,
  MachineDefinition,
  MachineRequirement,
  RecipeDefinition,
  ResourceRequirement,
  SolverInput,
  StressResult,
  TransportDefinition
} from "../types";
import { calculateByproductRate } from "./byproducts";
import { createWarning, warningForUtilization } from "./warnings";

interface SolverContext {
  input: SolverInput & { transportModeData: TransportDefinition };
  recipes: RecipeDefinition[];
  machinesById: Record<string, MachineDefinition>;
  itemsById: Record<string, ItemDefinition>;
  machines: MachineRequirement[];
  itemFlows: ItemFlow[];
  rawInputs: ResourceRequirement[];
  byproducts: ByproductFlow[];
  warnings: CalculatorWarning[];
  formulaBreakdown: FormulaDetail[];
  missingData: string[];
  unsupportedRecipeTypes: string[];
  selectedRecipe?: RecipeDefinition;
  resourceIndex: Map<string, ResourceRequirement>;
  byproductIndex: Map<string, ByproductFlow>;
  counter: number;
}

export function createSolverContext(params: {
  input: SolverInput & { transportModeData: TransportDefinition };
  recipes: RecipeDefinition[];
  machinesById: Record<string, MachineDefinition>;
  itemsById: Record<string, ItemDefinition>;
}): SolverContext {
  return {
    input: params.input,
    recipes: params.recipes,
    machinesById: params.machinesById,
    itemsById: params.itemsById,
    machines: [],
    itemFlows: [],
    rawInputs: [],
    byproducts: [],
    warnings: [],
    formulaBreakdown: [],
    missingData: [],
    unsupportedRecipeTypes: [],
    resourceIndex: new Map(),
    byproductIndex: new Map(),
    counter: 0
  };
}

function nextId(ctx: SolverContext, prefix: string): string {
  ctx.counter += 1;
  return `${prefix}:${ctx.counter}`;
}

function itemNodeId(itemId: string): string {
  return `item:${itemId}`;
}

function sourceNodeId(sourceId: string): string {
  return `source:${sourceId}`;
}

function getItem(ctx: SolverContext, itemId: string): ItemDefinition {
  const known = ctx.itemsById[itemId];
  if (known) {
    return known;
  }

  if (!ctx.missingData.includes(itemId)) {
    ctx.missingData.push(itemId);
  }

  return {
    id: itemId,
    name: itemId,
    stackSize: ctx.input.stackSize,
    sourceType: "imported"
  };
}

function addFlow(
  ctx: SolverContext,
  flow: Omit<ItemFlow, "id" | "mode">
): void {
  ctx.itemFlows.push({
    ...flow,
    id: nextId(ctx, "flow"),
    mode: ctx.input.mode
  });
}

function addResourceRequirement(params: {
  ctx: SolverContext;
  item: ItemDefinition;
  ratePerMinute: number;
  source: ResourceRequirement["source"];
  sourceName: string;
  nodeId: string;
}): void {
  const key = `${params.source}:${params.item.id}:${params.sourceName}`;
  const existing = params.ctx.resourceIndex.get(key);

  if (existing) {
    existing.ratePerMinute += params.ratePerMinute;
    existing.ratePerSecond = existing.ratePerMinute / 60;
    existing.ratePerHour = existing.ratePerMinute * 60;
    return;
  }

  const requirement: ResourceRequirement = {
    id: nextId(params.ctx, "resource"),
    nodeId: params.nodeId,
    itemId: params.item.id,
    itemName: params.item.name,
    ratePerSecond: params.ratePerMinute / 60,
    ratePerMinute: params.ratePerMinute,
    ratePerHour: params.ratePerMinute * 60,
    source: params.source,
    sourceName: params.sourceName
  };

  params.ctx.resourceIndex.set(key, requirement);
  params.ctx.rawInputs.push(requirement);
}

function addByproduct(params: {
  ctx: SolverContext;
  item: ItemDefinition;
  ratePerMinute: number;
  recipeId: string;
  chance: number;
}): void {
  const key = `${params.recipeId}:${params.item.id}`;
  const existing = params.ctx.byproductIndex.get(key);

  if (existing) {
    existing.ratePerMinute += params.ratePerMinute;
    return;
  }

  const byproduct: ByproductFlow = {
    id: nextId(params.ctx, "byproduct"),
    itemId: params.item.id,
    itemName: params.item.name,
    ratePerMinute: params.ratePerMinute,
    fromRecipeId: params.recipeId,
    chance: params.chance
  };

  params.ctx.byproductIndex.set(key, byproduct);
  params.ctx.byproducts.push(byproduct);
}

function buildModeResult(params: {
  throughputPerMachine: number;
  machineCount: number;
  stress: StressResult;
  details: FormulaDetail[];
}) {
  return {
    throughputPerMachine: params.throughputPerMachine,
    machineCount: params.machineCount,
    blockCount: params.stress.blockCount,
    availableRatePerMinute:
      params.throughputPerMachine * Number(params.machineCount || 0),
    stressSu: params.stress.totalSu,
    details: params.details
  };
}

function addCobblestoneGeneratorSource(
  ctx: SolverContext,
  item: ItemDefinition,
  requiredRatePerMinute: number
): void {
  const machine = ctx.machinesById["create:mechanical_drill"];
  if (!machine) {
    ctx.warnings.push(
      createWarning({
        id: nextId(ctx, "warning"),
        severity: "error",
        title: "Missing Mechanical Drill data",
        message: "Cobblestone generation cannot be planned without drill data."
      })
    );
    return;
  }

  const requirement = calculateMechanicalDrillRequirements({
    targetItemsPerMinute: requiredRatePerMinute,
    rpm: ctx.input.rpm,
    safetyMargin: DEFAULT_DRILL_SAFETY_MARGIN
  });
  const selectedCount =
    ctx.input.mode === "realistic"
      ? requirement.recommendedDrills
      : requirement.approximateDrills;
  const selectedRate =
    ctx.input.mode === "realistic"
      ? requirement.realisticRatePerDrill
      : requirement.approximateRatePerDrill;
  const approximateStress = calculateStress({
    machine,
    rpm: ctx.input.rpm,
    machineCount: requirement.approximateDrills
  });
  const realisticStress = calculateStress({
    machine,
    rpm: ctx.input.rpm,
    machineCount: requirement.realisticMinimumDrills
  });
  const selectedStress = calculateStress({
    machine,
    rpm: ctx.input.rpm,
    machineCount: selectedCount
  });
  const nodeId = `machine:${nextId(ctx, "mechanical_drill")}`;
  const availableRatePerMinute = selectedRate * selectedCount;
  const utilization = calculateUtilization(
    requiredRatePerMinute,
    availableRatePerMinute
  );
  const utilizationStatus = getUtilizationStatus(utilization);
  const warning = warningForUtilization({
    id: nextId(ctx, "warning"),
    status: utilizationStatus,
    utilization,
    nodeId,
    role: "input_supply"
  });

  if (warning) {
    ctx.warnings.push(warning);
  }

  const machineRequirement: MachineRequirement = {
    id: nextId(ctx, "machine_requirement"),
    nodeId,
    machineId: machine.id,
    machineName: machine.name,
    purpose: "Cobblestone Generator + Mechanical Drills",
    role: "input_provider",
    outputItemId: item.id,
    rpm: ctx.input.rpm,
    selectedMode: ctx.input.mode,
    requiredRatePerMinute,
    availableRatePerMinute,
    count: selectedCount,
    blockCount: selectedStress.blockCount,
    stress: selectedStress,
    utilization,
    utilizationStatus,
    approximate: {
      ...buildModeResult({
        throughputPerMachine: requirement.approximateRatePerDrill,
        machineCount: requirement.approximateDrills,
        stress: approximateStress,
        details: [
          {
            label: "Approx drills",
            value: `${requiredRatePerMinute.toFixed(2)} / ${requirement.approximateRatePerDrill.toFixed(2)} = ${requirement.approximateDrills}`
          }
        ]
      })
    },
    realistic: {
      ...buildModeResult({
        throughputPerMachine: requirement.realisticRatePerDrill,
        machineCount: requirement.realisticMinimumDrills,
        stress: realisticStress,
        details: [
          {
            label: "Realistic drills",
            value: `${requiredRatePerMinute.toFixed(2)} / ${requirement.realisticRatePerDrill.toFixed(2)} = ${requirement.realisticMinimumDrills}`
          }
        ]
      }),
      recommendedCount: requirement.recommendedDrills
    },
    formula: [
      {
        label: "Approximate drill rate",
        value: `60 / ((45 * 2) / ${ctx.input.rpm}) = ${requirement.approximateRatePerDrill.toFixed(2)} cobble/min`
      },
      {
        label: "Realistic drill rate",
        value: `${ctx.input.rpm} RPM table value = ${requirement.realisticRatePerDrill.toFixed(2)} cobble/min`
      },
      {
        label: "Recommended drills",
        value: `ceil(${requiredRatePerMinute.toFixed(2)} * 1.10 / ${requirement.realisticRatePerDrill.toFixed(2)}) = ${requirement.recommendedDrills}`
      }
    ],
    warnings: [
      "Real cobblestone generator rates vary by Create version, modpack, server TPS, and block update behavior.",
      ...(warning ? [warning.message] : [])
    ]
  };

  ctx.machines.push(machineRequirement);
  ctx.formulaBreakdown.push(...machineRequirement.formula);

  const generatorSourceNodeId = sourceNodeId("cobblestone_generator");
  addResourceRequirement({
    ctx,
    item,
    ratePerMinute: requiredRatePerMinute,
    source: "generated",
    sourceName: "Cobblestone Generator",
    nodeId: generatorSourceNodeId
  });

  addFlow(ctx, {
    itemId: item.id,
    itemName: item.name,
    ratePerMinute: requiredRatePerMinute,
    sourceNodeId: generatorSourceNodeId,
    targetNodeId: nodeId,
    kind: "generated"
  });
  addFlow(ctx, {
    itemId: item.id,
    itemName: item.name,
    ratePerMinute: requiredRatePerMinute,
    sourceNodeId: nodeId,
    targetNodeId: itemNodeId(item.id),
    kind: "output"
  });
}

function addRawSource(
  ctx: SolverContext,
  item: ItemDefinition,
  requiredRatePerMinute: number
): void {
  const rawSourceNodeId = sourceNodeId(item.id);
  const source = item.sourceType === "generated" ? "generated" : item.sourceType;

  addResourceRequirement({
    ctx,
    item,
    ratePerMinute: requiredRatePerMinute,
    source,
    sourceName: source === "imported" ? "External input" : "Raw/imported input",
    nodeId: rawSourceNodeId
  });
  addFlow(ctx, {
    itemId: item.id,
    itemName: item.name,
    ratePerMinute: requiredRatePerMinute,
    sourceNodeId: rawSourceNodeId,
    targetNodeId: itemNodeId(item.id),
    kind: source === "generated" ? "generated" : "raw"
  });
}

function addMachineForRecipe(params: {
  ctx: SolverContext;
  recipe: RecipeDefinition;
  item: ItemDefinition;
  requiredRatePerMinute: number;
}): MachineRequirement | undefined {
  const machine = params.ctx.machinesById[params.recipe.machineId];
  if (!machine) {
    params.ctx.missingData.push(params.recipe.machineId);
    params.ctx.warnings.push(
      createWarning({
        id: nextId(params.ctx, "warning"),
        severity: "error",
        title: "Missing machine data",
        message: `No machine constants found for ${params.recipe.machineId}.`
      })
    );
    return undefined;
  }

  const calculator = getMachineCalculator(machine.id);
  const fixedMachine = params.ctx.input.fixedMachine;
  const isFixedMachine =
    fixedMachine?.machineId === machine.id &&
    fixedMachine.recipeId === params.recipe.id;
  const fixedMachineCount = fixedMachine?.machineCount ?? 0;
  const transport = params.ctx.input.transportMode;
  const calcParams = {
    recipe: params.recipe,
    machine,
    rpm: params.ctx.input.rpm,
    stackSize: params.ctx.input.stackSize,
    transportMode: transport,
    transport: params.ctx.input.transportModeData,
    targetItemId: params.item.id,
    realisticEfficiency: params.ctx.input.realisticEfficiency
  };
  const approximateThroughput = calculator.calculateApproximateThroughput(calcParams);
  const realisticThroughput = calculator.calculateRealisticThroughput(calcParams);

  if (
    approximateThroughput.itemsPerMinute <= 0 ||
    realisticThroughput.itemsPerMinute <= 0
  ) {
    params.ctx.warnings.push(
      createWarning({
        id: nextId(params.ctx, "warning"),
        severity: "error",
        title: "Unsupported throughput",
        message: `Recipe ${params.recipe.id} produced zero throughput.`
      })
    );
    return undefined;
  }

  const approximateCount = isFixedMachine
    ? fixedMachineCount
    : calculateMachineCount(
        params.requiredRatePerMinute,
        approximateThroughput.itemsPerMinute
      );
  const realisticCount = isFixedMachine
    ? fixedMachineCount
    : calculateMachineCount(
        params.requiredRatePerMinute,
        realisticThroughput.itemsPerMinute
      );
  const selectedCount =
    isFixedMachine
      ? fixedMachineCount
      : params.ctx.input.mode === "realistic"
        ? realisticCount
        : approximateCount;
  const selectedThroughput =
    params.ctx.input.mode === "realistic"
      ? realisticThroughput
      : approximateThroughput;
  const approximateStress = calculator.calculateStress({
    machine,
    rpm: params.ctx.input.rpm,
    machineCount: approximateCount
  });
  const realisticStress = calculator.calculateStress({
    machine,
    rpm: params.ctx.input.rpm,
    machineCount: realisticCount
  });
  const selectedStress =
    params.ctx.input.mode === "realistic" ? realisticStress : approximateStress;
  const nodeId = `machine:${nextId(params.ctx, machine.id.replace(":", "_"))}`;
  const availableRatePerMinute = selectedThroughput.itemsPerMinute * selectedCount;
  const utilization = calculateUtilization(
    params.requiredRatePerMinute,
    availableRatePerMinute
  );
  const utilizationStatus = getUtilizationStatus(utilization, {
    exactTarget: isFixedMachine || params.item.id === params.ctx.input.targetItemId
  });
  const warning = warningForUtilization({
    id: nextId(params.ctx, "warning"),
    status: utilizationStatus,
    utilization,
    nodeId,
    role:
      isFixedMachine || params.item.id === params.ctx.input.targetItemId
        ? "target_output"
        : "machine"
  });

  if (warning) {
    params.ctx.warnings.push(warning);
  }

  if (params.recipe.requiredHeat) {
    params.ctx.warnings.push(
      createWarning({
        id: nextId(params.ctx, "warning"),
        severity: "info",
        title: "Heat required",
        message: `${params.recipe.id} requires ${params.recipe.requiredHeat} basin conditions.`,
        nodeId
      })
    );
  }

  if (params.recipe.type === "create:sequenced_assembly") {
    params.ctx.unsupportedRecipeTypes.push(params.recipe.type);
    params.ctx.warnings.push(
      createWarning({
        id: nextId(params.ctx, "warning"),
        severity: "info",
        title: "Placeholder recipe",
        message: "Sequenced assembly is modeled as a single placeholder step in this MVP.",
        nodeId
      })
    );
  }

  const requirement: MachineRequirement = {
    id: nextId(params.ctx, "machine_requirement"),
    nodeId,
    machineId: machine.id,
    machineName: machine.name,
    recipeId: params.recipe.id,
    recipeSourceId: params.recipe.sourceId,
    recipeSourceName: params.recipe.sourceName,
    purpose: params.recipe.category,
    role: isFixedMachine
      ? "fixed_machine"
      : params.item.id === params.ctx.input.targetItemId
        ? "target"
        : "intermediate",
    outputItemId: params.item.id,
    rpm: params.ctx.input.rpm,
    selectedMode: params.ctx.input.mode,
    requiredRatePerMinute: params.requiredRatePerMinute,
    availableRatePerMinute,
    count: selectedCount,
    blockCount: selectedStress.blockCount,
    stress: selectedStress,
    utilization,
    utilizationStatus,
    approximate: buildModeResult({
      throughputPerMachine: approximateThroughput.itemsPerMinute,
      machineCount: approximateCount,
      stress: approximateStress,
      details: approximateThroughput.details
    }),
    realistic: buildModeResult({
      throughputPerMachine: realisticThroughput.itemsPerMinute,
      machineCount: realisticCount,
      stress: realisticStress,
      details: realisticThroughput.details
    }),
    formula: [
      ...selectedThroughput.details,
      {
        label: "Machine count",
        value: `ceil(${params.requiredRatePerMinute.toFixed(2)} / ${selectedThroughput.itemsPerMinute.toFixed(2)}) = ${selectedCount}`
      },
      {
        label: "SU",
        value: `${selectedStress.blockCount} blocks * ${machine.stressImpactPerRpm} SU/RPM * ${params.ctx.input.rpm} RPM = ${selectedStress.totalSu}`
      }
    ],
    warnings: warning ? [warning.message] : []
  };

  params.ctx.machines.push(requirement);
  params.ctx.formulaBreakdown.push(...requirement.formula);
  return requirement;
}

export function solveItem(
  ctx: SolverContext,
  itemId: string,
  requiredRatePerMinute: number,
  path: string[] = []
): void {
  const item = getItem(ctx, itemId);

  if (path.includes(itemId)) {
    ctx.warnings.push(
      createWarning({
        id: nextId(ctx, "warning"),
        severity: "error",
        title: "Recipe loop avoided",
        message: `Stopped recursion at ${itemId}; using imported input fallback.`
      })
    );
    addRawSource(ctx, item, requiredRatePerMinute);
    return;
  }

  const fixedRecipe = ctx.input.fixedMachine
    ? ctx.recipes.find((candidate) => candidate.id === ctx.input.fixedMachine?.recipeId)
    : undefined;
  const isFixedCobblestoneDrill =
    itemId === "minecraft:cobblestone" &&
    fixedRecipe?.id === "create:drilling/cobblestone_generator";

  if (itemId === "minecraft:cobblestone" && !isFixedCobblestoneDrill) {
    addCobblestoneGeneratorSource(ctx, item, requiredRatePerMinute);
    return;
  }

  const recipe =
    fixedRecipe?.outputs.some((output) => output.itemId === itemId)
      ? fixedRecipe
      : findRecipeForOutput(itemId, ctx.recipes);

  if (!recipe) {
    addRawSource(ctx, item, requiredRatePerMinute);
    return;
  }

  if (!ctx.selectedRecipe && itemId === ctx.input.targetItemId) {
    ctx.selectedRecipe = recipe;
  }

  const primaryOutput = getPrimaryOutput(recipe, itemId);
  const outputUnitsPerCycle = getOutputUnitsPerCycle(primaryOutput);
  const recipeRunsPerMinute = requiredRatePerMinute / outputUnitsPerCycle;
  const machineRequirement = addMachineForRecipe({
    ctx,
    recipe,
    item,
    requiredRatePerMinute
  });

  if (!machineRequirement) {
    addRawSource(ctx, item, requiredRatePerMinute);
    return;
  }

  addFlow(ctx, {
    itemId: item.id,
    itemName: item.name,
    ratePerMinute: requiredRatePerMinute,
    sourceNodeId: machineRequirement.nodeId,
    targetNodeId: itemNodeId(item.id),
    kind: "output",
    bottleneck: machineRequirement.utilizationStatus === "bottleneck"
  });

  for (const output of recipe.outputs) {
    if (output.itemId === primaryOutput.itemId) {
      continue;
    }

    const byproductItem = getItem(ctx, output.itemId);
    const byproductRate = calculateByproductRate({
      targetRatePerMinute: requiredRatePerMinute,
      primaryOutput,
      byproduct: output
    });
    addByproduct({
      ctx,
      item: byproductItem,
      ratePerMinute: byproductRate,
      recipeId: recipe.id,
      chance: output.chance
    });
    addFlow(ctx, {
      itemId: byproductItem.id,
      itemName: byproductItem.name,
      ratePerMinute: byproductRate,
      sourceNodeId: machineRequirement.nodeId,
      targetNodeId: itemNodeId(byproductItem.id),
      kind: "byproduct"
    });

    if (output.chance < 1) {
      ctx.warnings.push(
        createWarning({
          id: nextId(ctx, "warning"),
          severity: "info",
          title: "Probabilistic byproduct",
          message: `${byproductItem.name} is expected at ${(output.chance * 100).toFixed(0)}% chance.`,
          nodeId: machineRequirement.nodeId
        })
      );
    }
  }

  for (const inputStack of recipe.input) {
    const inputItem = getItem(ctx, inputStack.itemId);
    const inputRate = recipeRunsPerMinute * inputStack.count;

    addFlow(ctx, {
      itemId: inputItem.id,
      itemName: inputItem.name,
      ratePerMinute: inputRate,
      sourceNodeId: itemNodeId(inputItem.id),
      targetNodeId: machineRequirement.nodeId,
      kind: "input"
    });
    solveItem(ctx, inputItem.id, inputRate, [...path, itemId]);
  }
}

export type { SolverContext };

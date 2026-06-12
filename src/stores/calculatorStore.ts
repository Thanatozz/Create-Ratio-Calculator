import { create } from "zustand";
import {
  DEFAULT_MODE,
  DEFAULT_RATE_UNIT,
  DEFAULT_RPM,
  DEFAULT_STACK_SIZE,
  DEFAULT_TRANSPORT_MODE
} from "../calculator-core/constants";
import { calculateCrushingWheelStackTime } from "../calculator-core/machines/crushingWheel";
import { solveFixedMachines } from "../calculator-core/solver/solveFixedMachines";
import { solveProduction } from "../calculator-core/solver/solveProduction";
import type {
  CalculationMode,
  CalculatorMode,
  RateUnit,
  RpmPreset,
  SolverOutput,
  TransportMode
} from "../calculator-core/types";
import { recipes } from "../data/create-1.21.1/recipes";
import { getVisibleSuGenerators } from "../data/create-1.21.1/suGenerators";
import { getRecipeDefinitionsFromEnabledSources } from "../data/recipeSources";
import { transportModes } from "../data/create-1.21.1/transport";
import { useSettingsStore } from "./settingsStore";

function defaultScenarioRate(params: {
  rpm: RpmPreset;
  stackSize: number;
  transportMode: TransportMode;
}): number {
  const recipe = recipes.find((candidate) => candidate.id === "create:crushing/cobblestone");
  if (!recipe) {
    return 1113;
  }

  const ticks = calculateCrushingWheelStackTime({
    processingTimeTicks: recipe.processingTimeTicks,
    rpm: params.rpm,
    stackSize: params.stackSize,
    inputDelayTicks: transportModes[params.transportMode].inputDelayTicks
  });

  return Math.round((params.stackSize * 1200) / ticks);
}

function convertRateToPerMinute(params: {
  value: number;
  unit: RateUnit;
  stackSize: number;
}): number {
  switch (params.unit) {
    case "items_per_second":
      return params.value * 60;
    case "items_per_minute":
      return params.value;
    case "stacks_per_minute":
      return params.value * params.stackSize;
    case "machines":
      return params.value;
    case "machines_per_second":
      return params.value * 60;
    case "machines_per_minute":
      return params.value;
  }
}

interface CalculationSnapshot {
  calculationMode: CalculationMode;
  targetItemId: string;
  targetRate: number;
  rateUnit: RateUnit;
  fixedMachineId: string;
  fixedRecipeId: string;
  fixedMachineCount: number;
  rpm: RpmPreset;
  mode: CalculatorMode;
  stackSize: number;
  transportMode: TransportMode;
}

function calculate(snapshot: CalculationSnapshot): SolverOutput {
  const settings = useSettingsStore.getState();
  const activeRecipes = getRecipeDefinitionsFromEnabledSources(
    settings.enabledRecipeSourceIds
  );
  const activeSuGenerators = getVisibleSuGenerators(
    settings.showCreativeGenerator
  );

  if (snapshot.calculationMode === "fixed_machines") {
    const fixedRecipeId = validRecipeForMachine(
      snapshot.fixedMachineId,
      snapshot.fixedRecipeId,
      activeRecipes
    );

    return solveFixedMachines({
      calculationMode: "fixed_machines",
      machineId: snapshot.fixedMachineId,
      recipeId: fixedRecipeId,
      machineCount: snapshot.fixedMachineCount,
      mode: snapshot.mode,
      rpm: snapshot.rpm,
      stackSize: snapshot.stackSize,
      transportMode: snapshot.transportMode,
      realisticEfficiency: settings.defaultEfficiency,
      suMargin: settings.suMargin,
      recipes: activeRecipes,
      suGenerators: activeSuGenerators,
      machineStressOverrides: settings.machineStressOverrides,
      generatorCapacityOverrides: settings.generatorCapacityOverrides
    });
  }

  return solveProduction({
    calculationMode: "target_output",
    targetItemId: snapshot.targetItemId,
    targetRatePerMinute: convertRateToPerMinute({
      value: snapshot.targetRate,
      unit: snapshot.rateUnit,
      stackSize: snapshot.stackSize
    }),
    mode: snapshot.mode,
    rpm: snapshot.rpm,
    stackSize: snapshot.stackSize,
    transportMode: snapshot.transportMode,
    realisticEfficiency: settings.defaultEfficiency,
    suMargin: settings.suMargin,
    recipes: activeRecipes,
    suGenerators: activeSuGenerators,
    machineStressOverrides: settings.machineStressOverrides,
    generatorCapacityOverrides: settings.generatorCapacityOverrides
  });
}

interface CalculatorState extends CalculationSnapshot {
  recipePreference: string;
  selectedNodeId?: string;
  result: SolverOutput;
  setCalculationMode: (value: CalculationMode) => void;
  setTargetItemId: (value: string) => void;
  setTargetRate: (value: number) => void;
  setRateUnit: (value: RateUnit) => void;
  setFixedMachineId: (value: string) => void;
  setFixedRecipeId: (value: string) => void;
  setFixedMachineCount: (value: number) => void;
  setRpm: (value: RpmPreset) => void;
  setMode: (value: CalculatorMode) => void;
  setStackSize: (value: number) => void;
  setTransportMode: (value: TransportMode) => void;
  setRecipePreference: (value: string) => void;
  setSelectedNodeId: (value: string | undefined) => void;
  calculate: () => void;
  loadExampleScenario: () => void;
  loadFixedMachineExample: () => void;
}

function firstRecipeForMachine(
  machineId: string,
  recipeList = recipes
): string {
  return (
    recipeList.find((recipe) => recipe.machineId === machineId)?.id ??
    recipeList[0]?.id ??
    ""
  );
}

function validRecipeForMachine(
  machineId: string,
  recipeId: string,
  recipeList = recipes
): string {
  const recipe = recipeList.find((candidate) => candidate.id === recipeId);
  if (recipe?.machineId === machineId) {
    return recipeId;
  }

  return firstRecipeForMachine(machineId, recipeList);
}

function defaultAssumptions() {
  const settings = useSettingsStore.getState();

  return {
    rpm: settings.defaultRpm ?? DEFAULT_RPM,
    mode: settings.defaultMode ?? DEFAULT_MODE,
    stackSize: settings.defaultStackSize ?? DEFAULT_STACK_SIZE,
    transportMode: settings.defaultTransportMode ?? DEFAULT_TRANSPORT_MODE
  };
}

function buildExampleSnapshot(overrides: Partial<CalculationSnapshot> = {}): CalculationSnapshot {
  const assumptions = defaultAssumptions();
  const baseSnapshot: CalculationSnapshot = {
    calculationMode: "target_output",
    targetItemId: "minecraft:gravel",
    targetRate: defaultScenarioRate(assumptions),
    rateUnit: DEFAULT_RATE_UNIT,
    fixedMachineId: "create:crushing_wheel_pair",
    fixedRecipeId: "create:crushing/cobblestone",
    fixedMachineCount: 1,
    ...assumptions
  };

  return {
    ...baseSnapshot,
    ...overrides
  };
}

function buildFixedMachineExampleSnapshot(): CalculationSnapshot {
  return buildExampleSnapshot({
    calculationMode: "fixed_machines",
    fixedMachineId: "create:crushing_wheel_pair",
    fixedRecipeId: "create:crushing/cobblestone",
    fixedMachineCount: 1,
    targetItemId: "minecraft:gravel"
  });
}

const initialSnapshot = buildExampleSnapshot();

export const useCalculatorStore = create<CalculatorState>((set, get) => ({
  ...initialSnapshot,
  recipePreference: "first_available",
  selectedNodeId: undefined,
  result: calculate(initialSnapshot),
  setCalculationMode: (calculationMode) =>
    set((state) => {
      const next = { ...state, calculationMode };
      return { calculationMode, result: calculate(next) };
    }),
  setTargetItemId: (targetItemId) =>
    set((state) => {
      const next = { ...state, targetItemId };
      return { targetItemId, result: calculate(next) };
    }),
  setTargetRate: (targetRate) =>
    set((state) => {
      const next = { ...state, targetRate };
      return { targetRate, result: calculate(next) };
    }),
  setRateUnit: (rateUnit) =>
    set((state) => {
      const next = { ...state, rateUnit };
      return { rateUnit, result: calculate(next) };
    }),
  setFixedMachineId: (fixedMachineId) =>
    set((state) => {
      const activeRecipes = getRecipeDefinitionsFromEnabledSources(
        useSettingsStore.getState().enabledRecipeSourceIds
      );
      const fixedRecipeId = firstRecipeForMachine(fixedMachineId, activeRecipes);
      const next = { ...state, fixedMachineId, fixedRecipeId };
      return {
        fixedMachineId,
        fixedRecipeId,
        result: calculate(next)
      };
    }),
  setFixedRecipeId: (fixedRecipeId) =>
    set((state) => {
      const activeRecipes = getRecipeDefinitionsFromEnabledSources(
        useSettingsStore.getState().enabledRecipeSourceIds
      );
      const next = {
        ...state,
        fixedRecipeId: validRecipeForMachine(
          state.fixedMachineId,
          fixedRecipeId,
          activeRecipes
        )
      };
      return { fixedRecipeId: next.fixedRecipeId, result: calculate(next) };
    }),
  setFixedMachineCount: (fixedMachineCount) =>
    set((state) => {
      const next = { ...state, fixedMachineCount };
      return { fixedMachineCount, result: calculate(next) };
    }),
  setRpm: (rpm) =>
    set((state) => {
      const next = { ...state, rpm };
      return { rpm, result: calculate(next) };
    }),
  setMode: (mode) =>
    set((state) => {
      const next = { ...state, mode };
      return { mode, result: calculate(next) };
    }),
  setStackSize: (stackSize) =>
    set((state) => {
      const next = { ...state, stackSize };
      return { stackSize, result: calculate(next) };
    }),
  setTransportMode: (transportMode) =>
    set((state) => {
      const next = { ...state, transportMode };
      return { transportMode, result: calculate(next) };
    }),
  setRecipePreference: (recipePreference) => set({ recipePreference }),
  setSelectedNodeId: (selectedNodeId) => set({ selectedNodeId }),
  calculate: () => {
    const state = get();
    set({ result: calculate(state) });
  },
  loadExampleScenario: () => {
    const snapshot = buildExampleSnapshot();
    set({
      ...snapshot,
      recipePreference: "first_available",
      selectedNodeId: undefined,
      result: calculate(snapshot)
    });
  },
  loadFixedMachineExample: () => {
    const snapshot = buildFixedMachineExampleSnapshot();
    set({
      ...snapshot,
      recipePreference: "first_available",
      selectedNodeId: undefined,
      result: calculate(snapshot)
    });
  }
}));

export { convertRateToPerMinute };

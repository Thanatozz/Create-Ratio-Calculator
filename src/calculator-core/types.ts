export type CalculatorMode = "approximate" | "realistic";

export type CalculationMode = "target_output" | "fixed_machines";

export type RateUnit =
  | "items_per_second"
  | "items_per_minute"
  | "stacks_per_minute"
  | "machines"
  | "machines_per_second"
  | "machines_per_minute";

export type RpmPreset = 16 | 32 | 64 | 128 | 256;

export type TransportMode =
  | "none"
  | "direct_throw"
  | "belt"
  | "chute"
  | "funnel"
  | "brass_funnel"
  | "depot"
  | "basin";

export type MachineType =
  | "physical_generator_consumer"
  | "stack_processing"
  | "single_item_processing"
  | "basin_processing"
  | "deploying"
  | "fan_processing"
  | "cutting"
  | "placeholder";

export type SourceType = "raw" | "generated" | "imported" | "byproduct";

export type WarningSeverity = "info" | "warning" | "error";

export type UtilizationStatus =
  | "comfortable"
  | "tight"
  | "very_tight"
  | "bottleneck"
  | "exact_target";

export type MachineRequirementRole =
  | "target"
  | "fixed_machine"
  | "input_provider"
  | "intermediate";

export interface FormulaDetail {
  label: string;
  value: string;
}

export interface ItemDefinition {
  id: string;
  name: string;
  stackSize: number;
  sourceType: SourceType;
  notes?: string;
}

export interface ItemStack {
  itemId: string;
  count: number;
}

export interface RecipeOutput extends ItemStack {
  chance: number;
}

export interface FluidStack {
  fluidId: string;
  amountMb: number;
}

export interface RecipeCondition {
  type: string;
  value: string | number | boolean;
}

export interface RecipeDefinition {
  id: string;
  type: string;
  category: string;
  input: ItemStack[];
  outputs: RecipeOutput[];
  processingTimeTicks: number;
  machineId: string;
  sourceId?: string;
  sourceName?: string;
  stackProcessing?: boolean;
  requiredHeat?: "heated" | "superheated";
  fluidInput?: FluidStack[];
  fluidOutput?: FluidStack[];
  conditions?: RecipeCondition[];
  notes?: string;
}

export interface MachineDefinition {
  id: string;
  name: string;
  type: MachineType;
  stressImpactPerRpm: number;
  defaultRpm: number;
  blocksPerSet?: number;
  defaultEfficiency?: number;
  realisticEfficiency?: number;
  notes?: string;
}

export interface TransportDefinition {
  id: TransportMode;
  name: string;
  inputDelayTicks: number;
  notes?: string;
}

export interface SuGeneratorDefinition {
  id: string;
  name: string;
  suCapacity: number;
  category: "early_game" | "mid_game" | "late_game" | "creative";
  configurable?: boolean;
  notes?: string;
}

export interface MachineCalculationParams {
  recipe: RecipeDefinition;
  machine: MachineDefinition;
  rpm: number;
  stackSize: number;
  transportMode: TransportMode;
  transport: TransportDefinition;
  targetItemId: string;
  realisticEfficiency: number;
}

export interface ThroughputResult {
  itemsPerMinute: number;
  cyclesPerMinute: number;
  effectiveProcessingTimeTicks: number;
  itemsPerCycle: number;
  efficiency: number;
  details: FormulaDetail[];
}

export interface StressCalculationParams {
  machine: MachineDefinition;
  rpm: number;
  machineCount: number;
}

export interface StressResult {
  machineCount: number;
  blockCount: number;
  stressImpactPerRpm: number;
  rpm: number;
  suPerMachineSet: number;
  totalSu: number;
}

export interface MachineCalculator {
  machineId: string;
  calculateApproximateThroughput(
    params: MachineCalculationParams
  ): ThroughputResult;
  calculateRealisticThroughput(params: MachineCalculationParams): ThroughputResult;
  calculateStress(params: StressCalculationParams): StressResult;
}

export interface RequirementModeResult {
  throughputPerMachine: number;
  machineCount: number;
  blockCount: number;
  availableRatePerMinute: number;
  stressSu: number;
  recommendedCount?: number;
  details: FormulaDetail[];
}

export interface MachineRequirement {
  id: string;
  nodeId: string;
  machineId: string;
  machineName: string;
  recipeId?: string;
  recipeSourceId?: string;
  recipeSourceName?: string;
  purpose: string;
  role?: MachineRequirementRole;
  outputItemId: string;
  rpm: number;
  selectedMode: CalculatorMode;
  requiredRatePerMinute: number;
  availableRatePerMinute: number;
  count: number;
  blockCount: number;
  stress: StressResult;
  utilization: number;
  utilizationStatus: UtilizationStatus;
  approximate: RequirementModeResult;
  realistic: RequirementModeResult;
  formula: FormulaDetail[];
  warnings: string[];
}

export interface ItemFlow {
  id: string;
  itemId: string;
  itemName: string;
  ratePerMinute: number;
  sourceNodeId: string;
  targetNodeId: string;
  kind: "input" | "output" | "byproduct" | "raw" | "generated";
  mode: CalculatorMode;
  bottleneck?: boolean;
}

export interface ResourceRequirement {
  id: string;
  nodeId: string;
  itemId: string;
  itemName: string;
  ratePerSecond: number;
  ratePerMinute: number;
  ratePerHour: number;
  source: SourceType;
  sourceName: string;
}

export interface ByproductFlow {
  id: string;
  itemId: string;
  itemName: string;
  ratePerMinute: number;
  fromRecipeId: string;
  chance: number;
}

export interface GeneratorPlan {
  id: string;
  generatorId: string;
  generatorName: string;
  category: SuGeneratorDefinition["category"];
  count: number;
  suCapacityEach: number;
  totalSu: number;
  surplusSu: number;
}

export interface MixedGeneratorPlan {
  id: string;
  name: string;
  parts: GeneratorPlan[];
  totalSu: number;
  surplusSu: number;
}

export interface SuSummary {
  consumedSu: number;
  recommendedSu: number;
  margin: number;
  generatorPlans: GeneratorPlan[];
  mixedPlans: MixedGeneratorPlan[];
  minimumSetup?: GeneratorPlan;
  recommendedSetup?: GeneratorPlan;
  earlyGameSetup?: GeneratorPlan;
  lateGameSetup?: GeneratorPlan;
  surplusOrDeficit: number;
  overstressed: boolean;
}

export interface CalculatorWarning {
  id: string;
  severity: WarningSeverity;
  title: string;
  message: string;
  nodeId?: string;
}

export type GraphNodeType =
  | "item"
  | "machine"
  | "source"
  | "sink"
  | "su_generator"
  | "warning";

export interface ProductionGraphNodeData {
  [key: string]: unknown;
  label: string;
  subtitle?: string;
  badge?: string;
  metrics?: Record<string, string>;
  raw?: unknown;
}

export interface ProductionGraphNode {
  id: string;
  type: GraphNodeType;
  position: { x: number; y: number };
  data: ProductionGraphNodeData;
}

export interface ProductionGraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  itemId?: string;
  ratePerMinute?: number;
  bottleneck?: boolean;
}

export interface ProductionGraph {
  nodes: ProductionGraphNode[];
  edges: ProductionGraphEdge[];
}

export interface TargetRequest {
  calculationMode?: CalculationMode;
  targetItemId: string;
  targetRatePerMinute: number;
  mode: CalculatorMode;
  rpm: number;
  stackSize: number;
  transportMode: TransportMode;
}

export interface SolverInput extends TargetRequest {
  realisticEfficiency: number;
  suMargin: number;
  recipes?: RecipeDefinition[];
  machineStressOverrides?: Record<string, number>;
  generatorCapacityOverrides?: Record<string, number>;
  fixedMachine?: {
    machineId: string;
    recipeId: string;
    machineCount: number;
  };
}

export interface FixedMachinesRequest {
  calculationMode: "fixed_machines";
  machineId: string;
  recipeId: string;
  machineCount: number;
  rpm: number;
  mode: CalculatorMode;
  transportMode: TransportMode;
  stackSize: number;
  realisticEfficiency?: number;
  suMargin?: number;
  recipes?: RecipeDefinition[];
  machineStressOverrides?: Record<string, number>;
  generatorCapacityOverrides?: Record<string, number>;
}

export interface NormalizedIngredient {
  itemId?: string;
  tag?: string;
  count: number;
  raw: unknown;
}

export interface NormalizedOutput {
  itemId?: string;
  fluidId?: string;
  count: number;
  chance: number;
  raw: unknown;
}

export interface NormalizedFluidIngredient {
  fluidId: string;
  amountMb: number;
  raw: unknown;
}

export interface NormalizedFluidOutput {
  fluidId: string;
  amountMb: number;
  raw: unknown;
}

export interface NormalizedCondition {
  type: string;
  raw: unknown;
}

export interface NormalizedRecipe {
  id: string;
  sourceId: string;
  namespace: string;
  path: string;
  type: string;
  inputs: NormalizedIngredient[];
  outputs: NormalizedOutput[];
  processingTimeTicks?: number;
  machineId?: string;
  heatRequirement?: "heated" | "superheated" | "none";
  fluidInputs?: NormalizedFluidIngredient[];
  fluidOutputs?: NormalizedFluidOutput[];
  conditions?: NormalizedCondition[];
  raw: unknown;
  supported: boolean;
  unsupportedReason?: string;
}

export interface NormalizedTag {
  id: string;
  sourceId: string;
  namespace: string;
  path: string;
  type: "item" | "fluid" | "unknown";
  values: string[];
  raw: unknown;
}

export interface RecipeSource {
  id: string;
  displayName: string;
  version?: string;
  loader?: "forge" | "neoforge" | "fabric" | "datapack" | "unknown";
  fileName?: string;
  defaultEnabled: boolean;
  alwaysEnabled?: boolean;
  recipeCount: number;
  supportedRecipeCount?: number;
  unsupportedRecipeCount?: number;
  tagCount: number;
  recipes: NormalizedRecipe[];
  tags: NormalizedTag[];
  metadata?: Record<string, unknown>;
}

export interface RecipeExtractionSummary {
  generatedAt: string;
  modsFolder: string;
  sourceCount: number;
  totalRecipeCount: number;
  supportedRecipeCount: number;
  unsupportedRecipeCount: number;
  tagCount: number;
  warnings: string[];
}

export interface SolverOutput {
  calculationMode: CalculationMode;
  target: TargetRequest;
  fixedMachine?: {
    machineId: string;
    recipeId: string;
    machineCount: number;
    nodeId?: string;
  };
  machines: MachineRequirement[];
  itemFlows: ItemFlow[];
  rawInputs: ResourceRequirement[];
  byproducts: ByproductFlow[];
  su: SuSummary;
  graph: ProductionGraph;
  warnings: CalculatorWarning[];
  formulaBreakdown: FormulaDetail[];
  selectedRecipe?: RecipeDefinition;
  missingData: string[];
  unsupportedRecipeTypes: string[];
}

export type ProductionSolveResult = SolverOutput;

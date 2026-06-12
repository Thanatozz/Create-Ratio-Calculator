import {
  ArrowDown,
  ArrowLeftToLine,
  ArrowRight,
  Boxes,
  Maximize,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  RotateCw,
  SlidersHorizontal
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import type { CalculationMode, CalculatorMode, MachineRequirement, RateUnit, RecipeDefinition, RpmPreset, TransportMode } from "../../calculator-core/types";
import { NumberField } from "../../components/controls/NumberField";
import { SelectField } from "../../components/controls/SelectField";
import { GraphCanvas } from "../../components/graph/GraphCanvas";
import { formatPercent, formatRate, formatSu, rateUnitLabel, utilizationClass } from "../../components/ui/format";
import { items } from "../../data/create-1.21.1/items";
import { machines } from "../../data/create-1.21.1/machines";
import { getRecipeDefinitionsFromEnabledSources } from "../../data/recipeSources";
import { suGenerators } from "../../data/create-1.21.1/suGenerators";
import { transportModes } from "../../data/create-1.21.1/transport";
import { useTranslation } from "../../i18n";
import { useCalculatorStore } from "../../stores/calculatorStore";
import { useSettingsStore } from "../../stores/settingsStore";
import { useUiStore } from "../../stores/uiStore";

const rpmOptions: RpmPreset[] = [16, 32, 64, 128, 256];
const calculationModeOptions: CalculationMode[] = ["target_output", "fixed_machines"];
const rateUnits: RateUnit[] = [
  "items_per_minute",
  "items_per_second",
  "stacks_per_minute"
];

function itemName(itemId: string): string {
  return items.find((item) => item.id === itemId)?.name ?? itemId;
}

function recipeLabel(recipe: RecipeDefinition): string {
  const inputs = recipe.input.map((input) => itemName(input.itemId)).join(" + ");
  const outputs = recipe.outputs
    .map((output) => itemName(output.itemId))
    .join(" + ");

  return `${inputs} -> ${outputs}`;
}

function isMachineRequirement(value: unknown): value is MachineRequirement {
  return (
    typeof value === "object" &&
    value !== null &&
    "machineId" in value &&
    "stress" in value
  );
}

function ToolbarButton({
  active,
  children,
  onClick,
  title
}: {
  active?: boolean;
  children: ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`flex h-8 items-center gap-1.5 rounded px-2 text-xs ${
        active
          ? "bg-factory-brass text-black"
          : "border border-factory-border bg-factory-panel2 text-stone-200 hover:border-factory-brass"
      }`}
    >
      {children}
    </button>
  );
}

export function VisualizeTab() {
  const calculator = useCalculatorStore();
  const result = calculator.result;
  const enabledRecipeSourceIds = useSettingsStore(
    (settings) => settings.enabledRecipeSourceIds
  );
  const preferredSuGeneratorId = useSettingsStore(
    (settings) => settings.preferredSuGeneratorId
  );
  const activeRecipes = getRecipeDefinitionsFromEnabledSources(enabledRecipeSourceIds);
  const recipeOptions = activeRecipes.filter(
    (recipe) => recipe.machineId === calculator.fixedMachineId
  );
  const selectedNodeId = useCalculatorStore((state) => state.selectedNodeId);
  const setSelectedNodeId = useCalculatorStore((state) => state.setSelectedNodeId);
  const selectedNode = useMemo(
    () => result.graph.nodes.find((node) => node.id === selectedNodeId),
    [result.graph.nodes, selectedNodeId]
  );
  const selectedMachine = isMachineRequirement(selectedNode?.data.raw)
    ? selectedNode.data.raw
    : undefined;
  const t = useTranslation();

  const graphDirection = useUiStore((state) => state.graphDirection);
  const setGraphDirection = useUiStore((state) => state.setGraphDirection);
  const showByproducts = useUiStore((state) => state.showByproducts);
  const setShowByproducts = useUiStore((state) => state.setShowByproducts);
  const requestAutoLayout = useUiStore((state) => state.requestAutoLayout);
  const requestFitView = useUiStore((state) => state.requestFitView);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const rightExpanded = Boolean(selectedNode && rightOpen);
  const preferredSuPlan = result.su.generatorPlans.find(
    (plan) => plan.generatorId === preferredSuGeneratorId
  );
  const preferredGenerator = suGenerators.find(
    (generator) => generator.id === preferredSuGeneratorId
  );
  const recommendedSuPlan = result.su.recommendedSetup ?? result.su.minimumSetup;
  const machineSummary = result.machines.map((machine) => ({
    id: machine.id,
    label: `${machine.count}x ${machine.machineName}`
  }));

  useEffect(() => {
    if (selectedNode) {
      setRightOpen(true);
    }
  }, [selectedNode]);

  return (
    <div
      className="grid h-full min-h-0 gap-2 p-2"
      style={{
        gridTemplateColumns: `${leftOpen ? "260px" : "42px"} minmax(0, 1fr) ${rightExpanded ? "320px" : "42px"}`
      }}
    >
      <aside className="min-h-0 overflow-hidden rounded-md border border-factory-border bg-factory-panel">
        {leftOpen ? (
          <div className="industrial-scrollbar flex h-full min-h-0 flex-col gap-3 overflow-auto p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-factory-brass">
                <SlidersHorizontal size={14} />
                {t("visualize.graphInputs")}
              </div>
              <button
                type="button"
                className="rounded p-1 text-stone-400 hover:bg-factory-panel2 hover:text-stone-100"
                onClick={() => setLeftOpen(false)}
                title={t("visualize.closeControls")}
              >
                <PanelLeftClose size={16} />
              </button>
            </div>
            <SelectField<CalculationMode>
              label="Calculation mode"
              value={calculator.calculationMode}
              options={calculationModeOptions.map((mode) => ({
                value: mode,
                label: mode === "target_output" ? t("mode.targetOutput") : t("mode.fixedMachines")
              }))}
              onChange={calculator.setCalculationMode}
            />
            {calculator.calculationMode === "target_output" ? (
              <>
                <SelectField
                  label={t("factory.targetItem")}
                  value={calculator.targetItemId}
                  options={items.map((item) => ({ value: item.id, label: item.name }))}
                  onChange={calculator.setTargetItemId}
                />
                <NumberField
                  label={t("factory.desiredOutput")}
                  value={calculator.targetRate}
                  min={0}
                  step={1}
                  onChange={calculator.setTargetRate}
                />
                <SelectField<RateUnit>
                  label={t("factory.rateUnit")}
                  value={calculator.rateUnit}
                  options={rateUnits.map((unit) => ({
                    value: unit,
                    label:
                      unit === "items_per_minute"
                        ? t("mode.itemsPerMinute")
                        : unit === "items_per_second"
                          ? t("mode.itemsPerSecond")
                          : unit === "stacks_per_minute"
                            ? t("mode.stacksPerMinute")
                            : rateUnitLabel(unit)
                  }))}
                  onChange={calculator.setRateUnit}
                />
              </>
            ) : (
              <>
                <SelectField
                  label={t("factory.machine")}
                  value={calculator.fixedMachineId}
                  options={machines
                    .filter((machine) =>
                      activeRecipes.some((recipe) => recipe.machineId === machine.id)
                    )
                    .map((machine) => ({ value: machine.id, label: machine.name }))}
                  onChange={calculator.setFixedMachineId}
                />
                <SelectField
                  label={t("factory.recipe")}
                  value={calculator.fixedRecipeId}
                  options={recipeOptions.map((recipe) => ({
                    value: recipe.id,
                    label: recipeLabel(recipe)
                  }))}
                  onChange={calculator.setFixedRecipeId}
                />
                <NumberField
                  label={t("factory.machineCount")}
                  value={calculator.fixedMachineCount}
                  min={1}
                  step={1}
                  onChange={calculator.setFixedMachineCount}
                />
              </>
            )}
            <SelectField<RpmPreset>
              label={t("factory.rpm")}
              value={calculator.rpm}
              options={rpmOptions.map((rpm) => ({ value: rpm, label: `${rpm} RPM` }))}
              onChange={(value) => calculator.setRpm(Number(value) as RpmPreset)}
            />
            <SelectField<CalculatorMode>
              label={t("factory.planningMode")}
              value={calculator.mode}
              options={[
                { value: "realistic", label: t("mode.realistic") },
                { value: "approximate", label: t("mode.approximate") }
              ]}
              onChange={calculator.setMode}
            />
            <SelectField<TransportMode>
              label={t("factory.transport")}
              value={calculator.transportMode}
              options={Object.values(transportModes).map((mode) => ({
                value: mode.id,
                label: `${mode.name} (${mode.inputDelayTicks} ticks)`
              }))}
              onChange={calculator.setTransportMode}
            />
            <NumberField
              label={t("factory.stackSize")}
              value={calculator.stackSize}
              min={1}
              max={64}
              step={1}
              onChange={calculator.setStackSize}
            />
          </div>
        ) : (
          <button
            type="button"
            className="flex h-full w-full items-start justify-center pt-3 text-stone-400 hover:bg-factory-panel2 hover:text-stone-100"
            onClick={() => setLeftOpen(true)}
            title={t("visualize.openControls")}
          >
            <PanelLeftOpen size={18} />
          </button>
        )}
      </aside>

      <section className="flex min-h-0 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-factory-border bg-factory-panel px-2 py-2">
          <ToolbarButton title={t("visualize.fitView")} onClick={requestFitView}>
            <Maximize size={14} />
            {t("visualize.fitView")}
          </ToolbarButton>
          <ToolbarButton title={t("visualize.autoLayout")} onClick={requestAutoLayout}>
            <RotateCw size={14} />
            {t("visualize.autoLayout")}
          </ToolbarButton>
          <ToolbarButton
            title={t("visualize.leftRight")}
            active={graphDirection === "RIGHT"}
            onClick={() => setGraphDirection("RIGHT")}
          >
            <ArrowRight size={14} />
            {t("visualize.leftRight")}
          </ToolbarButton>
          <ToolbarButton
            title={t("visualize.topBottom")}
            active={graphDirection === "DOWN"}
            onClick={() => setGraphDirection("DOWN")}
          >
            <ArrowDown size={14} />
            {t("visualize.topBottom")}
          </ToolbarButton>
          <ToolbarButton
            title={t("visualize.byproducts")}
            active={showByproducts}
            onClick={() => setShowByproducts(!showByproducts)}
          >
            <Boxes size={14} />
            {t("visualize.byproducts")}
          </ToolbarButton>
        </div>
        <div className="relative min-h-0 flex-1">
          <div className="pointer-events-none absolute right-3 top-3 z-10 grid w-[260px] gap-2">
            <details className="pointer-events-auto rounded-md border border-factory-border bg-factory-panel/95 text-sm shadow-panel" open>
              <summary className="cursor-pointer px-3 py-2 text-xs font-semibold uppercase tracking-wide text-factory-brass">
                {t("visualize.suSummary")}
              </summary>
              <div className="grid gap-1 border-t border-factory-border px-3 py-2 text-xs text-stone-300">
                <div className="flex justify-between gap-3">
                  <span>{t("visualize.needed")}</span>
                  <strong className="text-factory-su">{formatSu(result.su.recommendedSu)}</strong>
                </div>
                <div className="flex justify-between gap-3">
                  <span>{t("visualize.configured")}</span>
                  <strong>{preferredGenerator?.name ?? t("common.none")}</strong>
                </div>
                {preferredSuPlan ? (
                  <div className="flex justify-between gap-3">
                    <span>{t("visualize.configuredCount")}</span>
                    <strong>{preferredSuPlan.count}x</strong>
                  </div>
                ) : null}
                <div className="flex justify-between gap-3">
                  <span>{t("visualize.recommended")}</span>
                  <strong className="text-factory-brass">
                    {recommendedSuPlan
                      ? `${recommendedSuPlan.count}x ${recommendedSuPlan.generatorName}`
                      : t("common.none")}
                  </strong>
                </div>
              </div>
            </details>
            <details className="pointer-events-auto rounded-md border border-factory-border bg-factory-panel/95 text-sm shadow-panel">
              <summary className="cursor-pointer px-3 py-2 text-xs font-semibold uppercase tracking-wide text-factory-brass">
                {t("visualize.machineSummary")}
              </summary>
              <div className="grid gap-1 border-t border-factory-border px-3 py-2 text-xs text-stone-300">
                {machineSummary.map((machine) => (
                  <div key={machine.id}>{machine.label}</div>
                ))}
              </div>
            </details>
          </div>
          <GraphCanvas />
        </div>
      </section>

      <aside className="min-h-0 overflow-hidden rounded-md border border-factory-border bg-factory-panel">
        {rightExpanded ? (
          <div className="industrial-scrollbar h-full overflow-auto p-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-xs font-semibold uppercase tracking-wide text-factory-brass">
                  {t("visualize.nodeDetails")}
                </div>
                <div className="truncate text-sm text-stone-300">{selectedNode?.data.label}</div>
              </div>
              <button
                type="button"
                className="rounded p-1 text-stone-400 hover:bg-factory-panel2 hover:text-stone-100"
                onClick={() => {
                  setRightOpen(false);
                  setSelectedNodeId(undefined);
                }}
                title={t("visualize.closeDetails")}
              >
                <PanelRightClose size={16} />
              </button>
            </div>
            <div className="grid gap-2 text-sm">
              {selectedNode?.data.subtitle ? (
                <div className="rounded border border-factory-border bg-factory-panel2 p-2 text-stone-400">
                  {selectedNode.data.subtitle}
                </div>
              ) : null}
              {selectedNode?.data.metrics
                ? Object.entries(selectedNode.data.metrics).map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-3 border-b border-factory-border/70 py-1.5">
                      <span className="text-stone-500">{label}</span>
                      <span className="font-semibold text-stone-100">{value}</span>
                    </div>
                  ))
                : null}
              {selectedMachine ? (
                <>
                  <div className="mt-2 border-t border-factory-border pt-2 text-xs uppercase tracking-wide text-stone-500">
                    {t("visualize.machineRatios")}
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-stone-500">{t("visualize.approxMin")}</span>
                    <span className="text-factory-brass">{selectedMachine.approximate.machineCount}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-stone-500">{t("visualize.realisticMin")}</span>
                    <span className="text-factory-copper">{selectedMachine.realistic.machineCount}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-stone-500">{t("visualize.recommended")}</span>
                    <span className="text-factory-green">
                      {selectedMachine.realistic.recommendedCount ?? selectedMachine.count}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-stone-500">{t("factory.su")}</span>
                    <span className="text-factory-su">{formatSu(selectedMachine.stress.totalSu)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-stone-500">{t("common.notes")}</span>
                    <span className={utilizationClass(selectedMachine.utilizationStatus)}>
                      {t(`status.${selectedMachine.utilizationStatus}`)} ({formatPercent(selectedMachine.utilization)})
                    </span>
                  </div>
                  <div className="text-xs text-stone-500">
                    {t("visualize.availableOutput")}: {formatRate(selectedMachine.availableRatePerMinute)}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="flex h-full w-full items-start justify-center pt-3 text-stone-400 hover:bg-factory-panel2 hover:text-stone-100"
            onClick={() => setRightOpen(true)}
            title={t("visualize.openDetails")}
          >
            <ArrowLeftToLine size={18} />
          </button>
        )}
      </aside>
    </div>
  );
}

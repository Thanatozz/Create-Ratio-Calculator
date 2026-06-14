import {
  ArrowDown,
  ArrowRight,
  Boxes,
  Maximize,
  PanelLeftClose,
  PanelLeftOpen,
  RotateCw,
  SlidersHorizontal
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import type {
  CalculationMode,
  CalculatorMode,
  RateUnit,
  RpmPreset,
  TransportMode
} from "../../calculator-core/types";
import { NumberField } from "../../components/controls/NumberField";
import { RecipeSelectorField } from "../../components/controls/RecipeSelectorField";
import { SelectField } from "../../components/controls/SelectField";
import { TargetItemField } from "../../components/controls/TargetItemField";
import { GraphCanvas } from "../../components/graph/GraphCanvas";
import { CollapsiblePanel } from "../../components/ui/CollapsiblePanel";
import { formatSu, rateUnitLabel } from "../../components/ui/format";
import { machines } from "../../data/create-1.21.1/machines";
import { getActiveRegistry } from "../../data/recipeRegistry";
import { getVisibleSuGenerators } from "../../data/create-1.21.1/suGenerators";
import { transportModes } from "../../data/create-1.21.1/transport";
import { useIsMobile } from "../../hooks/useIsMobile";
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
      className={`create-toolbar-button flex h-9 items-center gap-1.5 rounded px-2.5 text-xs ${
        active
          ? "create-toolbar-button--active bg-factory-brass text-black"
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
  const showCreativeGenerator = useSettingsStore(
    (settings) => settings.showCreativeGenerator
  );
  const activeRecipes = getActiveRegistry(enabledRecipeSourceIds).recipes;
  const recipeOptions = activeRecipes.filter(
    (recipe) => recipe.machineId === calculator.fixedMachineId
  );
  const t = useTranslation();
  const isMobile = useIsMobile();

  const graphDirection = useUiStore((state) => state.graphDirection);
  const setGraphDirection = useUiStore((state) => state.setGraphDirection);
  const showByproducts = useUiStore((state) => state.showByproducts);
  const setShowByproducts = useUiStore((state) => state.setShowByproducts);
  const requestAutoLayout = useUiStore((state) => state.requestAutoLayout);
  const requestFitView = useUiStore((state) => state.requestFitView);
  const [leftOpen, setLeftOpen] = useState(true);

  const visibleSuGenerators = getVisibleSuGenerators(showCreativeGenerator);
  const preferredGenerator =
    visibleSuGenerators.find((generator) => generator.id === preferredSuGeneratorId) ??
    visibleSuGenerators[0];
  const preferredSuPlan = result.su.generatorPlans.find(
    (plan) => plan.generatorId === preferredGenerator?.id
  );
  const recommendedSuPlan = result.su.recommendedSetup ?? result.su.minimumSetup;
  const machineSummary = result.machines.map((machine) => ({
    id: machine.id,
    label: `${machine.count}x ${machine.machineName}`
  }));

  // Default to a top-to-bottom layout on phones (fits the narrow viewport better).
  const appliedMobileDirection = useRef(false);
  useEffect(() => {
    if (isMobile && !appliedMobileDirection.current) {
      appliedMobileDirection.current = true;
      setGraphDirection("DOWN");
    }
  }, [isMobile, setGraphDirection]);

  const controls = (
    <>
      <SelectField<CalculationMode>
        label={t("factory.calculationMode")}
        value={calculator.calculationMode}
        options={calculationModeOptions.map((mode) => ({
          value: mode,
          label: mode === "target_output" ? t("mode.targetOutput") : t("mode.fixedMachines")
        }))}
        onChange={calculator.setCalculationMode}
      />
      {calculator.calculationMode === "target_output" ? (
        <>
          <TargetItemField
            label={t("factory.targetItem")}
            value={calculator.targetItemId}
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
          <RecipeSelectorField
            label={t("factory.recipe")}
            value={calculator.fixedRecipeId}
            recipes={recipeOptions}
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
      {/* <SelectField<RpmPreset>
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
      /> */}
    </>
  );

  const toolbar = (
    <div className="create-panel flex flex-wrap items-center gap-2 px-2 py-2">
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
  );

  const suSummaryContent = (
    <div className="grid gap-2 px-3 py-2 text-xs text-stone-300">
      <div className="grid gap-0.5">
        <span className="text-[10px] uppercase tracking-wide text-stone-500">
          {t("visualize.needed")}
        </span>
        <strong className="text-sm text-factory-su">
          {formatSu(result.su.recommendedSu)}
        </strong>
      </div>
      <div className="leading-snug">
        <span className="mr-1 text-[10px] uppercase tracking-wide text-stone-500">
          {t("visualize.setup")}:
        </span>
        {preferredSuPlan && preferredGenerator ? (
          <span>
            <strong className="text-factory-brass">{preferredSuPlan.count}x</strong>{" "}
            <span className="text-stone-200">{preferredGenerator.name}</span>
          </span>
        ) : (
          <strong>{t("common.none")}</strong>
        )}
      </div>
      <div className="leading-snug">
        <span className="mr-1 text-[10px] uppercase tracking-wide text-stone-500">
          {t("visualize.recommended")}:
        </span>
        {recommendedSuPlan ? (
          <span>
            <strong className="text-factory-brass">{recommendedSuPlan.count}x</strong>{" "}
            <span className="text-stone-200">{recommendedSuPlan.generatorName}</span>
          </span>
        ) : (
          <strong>{t("common.none")}</strong>
        )}
      </div>
    </div>
  );

  const machinesContent = (
    <div className="grid gap-1 px-3 py-2 text-xs text-stone-300">
      {machineSummary.length > 0 ? (
        machineSummary.map((machine) => <div key={machine.id}>{machine.label}</div>)
      ) : (
        <span className="text-stone-500">{t("common.none")}</span>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <div className="create-page flex min-h-0 flex-col gap-2 p-2">
        <CollapsiblePanel
          title={t("visualize.graphInputs")}
          icon={<SlidersHorizontal size={14} />}
          defaultOpen={false}
          bodyClassName="grid gap-3 p-3"
        >
          {controls}
        </CollapsiblePanel>
        {toolbar}
        <div className="relative h-[70vh] min-h-[420px] shrink-0">
          <GraphCanvas />
        </div>
        <CollapsiblePanel
          title={t("visualize.suSummary")}
          defaultOpen={false}
          bodyClassName="p-0"
        >
          {suSummaryContent}
        </CollapsiblePanel>
        <CollapsiblePanel
          title={t("visualize.machineSummary")}
          defaultOpen={false}
          bodyClassName="p-0"
        >
          {machinesContent}
        </CollapsiblePanel>
      </div>
    );
  }

  return (
    <div
      className="create-page grid h-full min-h-0 gap-2 p-2"
      style={{
        gridTemplateColumns: `${leftOpen ? "260px" : "42px"} minmax(0, 1fr)`
      }}
    >
      <aside className="create-panel min-h-0 overflow-hidden">
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
            {controls}
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

      <section className="flex min-h-0 flex-1 flex-col gap-2">
        {toolbar}
        <div className="relative min-h-0 flex-1">
          <div className="pointer-events-none absolute right-3 top-3 z-10 grid w-60 gap-2">
            <details className="create-panel pointer-events-auto text-sm shadow-panel" open>
              <summary className="cursor-pointer px-3 py-2 text-xs font-semibold uppercase tracking-wide text-factory-brass">
                {t("visualize.suSummary")}
              </summary>
              <div className="border-t border-factory-border">{suSummaryContent}</div>
            </details>
            <details className="create-panel pointer-events-auto text-sm shadow-panel">
              <summary className="cursor-pointer px-3 py-2 text-xs font-semibold uppercase tracking-wide text-factory-brass">
                {t("visualize.machineSummary")}
              </summary>
              <div className="border-t border-factory-border">{machinesContent}</div>
            </details>
          </div>
          <GraphCanvas />
        </div>
      </section>
    </div>
  );
}

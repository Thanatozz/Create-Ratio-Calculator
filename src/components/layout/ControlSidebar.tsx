import { Calculator, PackageSearch, RotateCcw, Timer } from "lucide-react";
import type { CalculationMode, RateUnit, RecipeDefinition } from "../../calculator-core/types";
import { NumberField } from "../controls/NumberField";
import { SelectField } from "../controls/SelectField";
import { CreateIcon } from "../icons/CreateIcon";
import { items } from "../../data/create-1.21.1/items";
import { machines } from "../../data/create-1.21.1/machines";
import { CREATE_BASE_SOURCE_ID, getRecipeDefinitionsFromEnabledSources } from "../../data/recipeSources";
import { useTranslation } from "../../i18n";
import { useCalculatorStore } from "../../stores/calculatorStore";
import { useSettingsStore } from "../../stores/settingsStore";

const calculationModeOptions: CalculationMode[] = ["target_output", "fixed_machines"];
const rateUnits: RateUnit[] = [
  "items_per_minute",
  "items_per_second",
  "stacks_per_minute"
];
const examplePresets = [
  { id: "custom", labelKey: "factory.chooseExample", itemId: "", rate: 0 },
  { id: "cobblestone", labelKey: "factory.cobblestonePerMin", itemId: "minecraft:cobblestone", rate: 256 },
  { id: "gravel", labelKey: "factory.gravelPerMin", itemId: "minecraft:gravel", rate: 1113 },
  { id: "sand", labelKey: "factory.sandPerMin", itemId: "minecraft:sand", rate: 1113 },
  { id: "andesite_alloy", labelKey: "factory.andesiteAlloyPerMin", itemId: "create:andesite_alloy", rate: 64 },
  { id: "brass", labelKey: "factory.brassPerMin", itemId: "create:brass_ingot", rate: 64 },
  { id: "iron_sheet", labelKey: "factory.ironSheetPerMin", itemId: "create:iron_sheet", rate: 64 },
  { id: "fixed_crusher", labelKey: "factory.fixedCrusher", itemId: "", rate: 0 }
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

export function ControlSidebar() {
  const state = useCalculatorStore();
  const settings = useSettingsStore();
  const t = useTranslation();
  const enabledRecipeSourceIds = settings.enabledRecipeSourceIds;
  const activeRecipes = getRecipeDefinitionsFromEnabledSources(enabledRecipeSourceIds);
  const recipeOptions = activeRecipes
    .filter((recipe) => recipe.machineId === state.fixedMachineId)
    .sort((a, b) => {
      if (settings.pinnedRecipeId) {
        if (a.id === settings.pinnedRecipeId) return -1;
        if (b.id === settings.pinnedRecipeId) return 1;
      }
      if (settings.recipeSourcePreference === "create_base") {
        return Number(b.sourceId === CREATE_BASE_SOURCE_ID) - Number(a.sourceId === CREATE_BASE_SOURCE_ID);
      }
      if (settings.recipeSourcePreference === "addons") {
        return Number(a.sourceId === CREATE_BASE_SOURCE_ID) - Number(b.sourceId === CREATE_BASE_SOURCE_ID);
      }
      return 0;
    });

  return (
    <aside className="create-left-panel industrial-scrollbar flex min-h-0 flex-col gap-4 overflow-auto p-4">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-factory-brass">
          {t("factory.title")}
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          {t("factory.description")}
        </p>
      </div>

      <SelectField<CalculationMode>
        icon={<Calculator size={14} />}
        label={t("factory.calculationMode")}
        value={state.calculationMode}
        options={calculationModeOptions.map((mode) => ({
          value: mode,
          label: mode === "target_output" ? t("mode.targetOutput") : t("mode.fixedMachines")
        }))}
        onChange={state.setCalculationMode}
      />

      {state.calculationMode === "target_output" ? (
        <>
          <SelectField
            icon={<CreateIcon id={state.targetItemId} />}
            label={t("factory.targetItem")}
            value={state.targetItemId}
            options={items.map((item) => ({ value: item.id, label: item.name }))}
            onChange={state.setTargetItemId}
          />

          <NumberField
            icon={<Timer size={14} />}
            label={t("factory.desiredOutput")}
            value={state.targetRate}
            min={0}
            step={1}
            onChange={state.setTargetRate}
          />

          <SelectField<RateUnit>
            label={t("factory.rateUnit")}
            value={state.rateUnit}
            options={rateUnits.map((unit) => ({
              value: unit,
              label:
                unit === "items_per_minute"
                  ? t("mode.itemsPerMinute")
                  : unit === "items_per_second"
                    ? t("mode.itemsPerSecond")
                    : t("mode.stacksPerMinute")
            }))}
            onChange={state.setRateUnit}
          />
        </>
      ) : (
        <>
          <SelectField
            icon={<CreateIcon id={state.fixedMachineId} kind="machine" />}
            label={t("factory.machine")}
            value={state.fixedMachineId}
            options={machines
              .filter((machine) =>
                activeRecipes.some((recipe) => recipe.machineId === machine.id)
              )
              .map((machine) => ({ value: machine.id, label: machine.name }))}
            onChange={state.setFixedMachineId}
          />

          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2">
            <SelectField
              icon={<PackageSearch size={14} />}
              label={t("factory.recipe")}
              value={state.fixedRecipeId}
              options={recipeOptions.map((recipe) => ({
                value: recipe.id,
                label: recipeLabel(recipe)
              }))}
              onChange={state.setFixedRecipeId}
            />
            <details className="relative">
              <summary
                className="create-kebab-menu flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-md border border-factory-border bg-factory-panel2 text-[0px] text-stone-200 hover:border-factory-brass"
                title={t("recipeMenu.label")}
              >
                ⋮
              </summary>
              <div className="absolute right-0 z-20 mt-2 grid w-52 gap-1 rounded-md border border-factory-border bg-factory-panel p-2 text-xs shadow-panel">
                <button className="rounded px-2 py-1 text-left text-stone-200 hover:bg-factory-panel2" type="button" onClick={() => settings.setRecipeSourcePreference("enabled_sources")}>
                  {t("recipeMenu.viewAlternatives")}
                </button>
                <button className="rounded px-2 py-1 text-left text-stone-200 hover:bg-factory-panel2" type="button" onClick={() => settings.setRecipeSourcePreference("create_base")}>
                  {t("recipeMenu.preferCreateBase")}
                </button>
                <button className="rounded px-2 py-1 text-left text-stone-200 hover:bg-factory-panel2" type="button" onClick={() => settings.setRecipeSourcePreference("addons")}>
                  {t("recipeMenu.preferAddon")}
                </button>
                <button className="rounded px-2 py-1 text-left text-stone-200 hover:bg-factory-panel2" type="button" onClick={() => settings.setPinnedRecipeId(state.fixedRecipeId)}>
                  {t("recipeMenu.pinRecipe")}
                </button>
              </div>
            </details>
          </div>

          <NumberField
            icon={<Timer size={14} />}
            label={t("factory.machineCount")}
            value={state.fixedMachineCount}
            min={1}
            step={1}
            onChange={state.setFixedMachineCount}
          />
        </>
      )}

      <div className="grid grid-cols-1 gap-2">
        <button
          className="create-primary-button flex h-10 items-center justify-center gap-2 px-3 text-sm font-semibold"
          type="button"
          onClick={state.calculate}
        >
          <Calculator size={16} />
          {t("common.calculate")}
        </button>
        <SelectField
          icon={<RotateCcw size={14} />}
          label={t("factory.examplePreset")}
          value="custom"
          options={examplePresets.map((preset) => ({
            value: preset.id,
            label: t(preset.labelKey)
          }))}
          onChange={(presetId) => {
            const preset = examplePresets.find((candidate) => candidate.id === presetId);
            if (!preset || preset.id === "custom") {
              return;
            }
            if (preset.id === "fixed_crusher") {
              state.loadFixedMachineExample();
              return;
            }
            state.setCalculationMode("target_output");
            state.setRateUnit("items_per_minute");
            state.setTargetItemId(preset.itemId);
            state.setTargetRate(preset.rate);
          }}
        />
      </div>
    </aside>
  );
}

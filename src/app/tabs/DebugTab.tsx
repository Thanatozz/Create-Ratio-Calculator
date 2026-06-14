import { useCalculatorStore } from "../../stores/calculatorStore";
import { useSettingsStore } from "../../stores/settingsStore";
import {
  allRecipeSources,
  getRecipesBySource,
  getRecipesByType
} from "../../data/recipeSources";
import { recipeExtractionSummary } from "../../data/generated/recipeExtractionSummary.generated";
import { useTranslation } from "../../i18n";

function JsonPanel({ title, value }: { title: string; value: unknown }) {
  return (
    <section className="rounded-lg border border-factory-border bg-factory-panel">
      <div className="border-b border-factory-border p-3 text-sm font-semibold uppercase tracking-wide text-factory-brass">
        {title}
      </div>
      <pre className="industrial-scrollbar max-h-96 overflow-auto p-3 text-xs leading-relaxed text-stone-300">
        {JSON.stringify(value, null, 2)}
      </pre>
    </section>
  );
}

export function DebugTab() {
  const result = useCalculatorStore((state) => state.result);
  const settings = useSettingsStore();
  const t = useTranslation();
  const enabledSourceIds = new Set(settings.enabledRecipeSourceIds);
  const enabledSources = allRecipeSources.filter(
    (source) => source.alwaysEnabled || enabledSourceIds.has(source.id)
  );
  const disabledSources = allRecipeSources.filter(
    (source) => !source.alwaysEnabled && !enabledSourceIds.has(source.id)
  );
  const unsupportedRecipes = allRecipeSources.flatMap((source) =>
    source.recipes
      .filter((recipe) => !recipe.supported)
      .map((recipe) => ({
        sourceId: source.id,
        sourceName: source.displayName,
        id: recipe.id,
        type: recipe.type,
        reason: recipe.unsupportedReason
      }))
  );
  const unsupportedRecipeTypes = unsupportedRecipes.reduce<Record<string, number>>(
    (acc, recipe) => {
      acc[recipe.type] = (acc[recipe.type] ?? 0) + 1;
      return acc;
    },
    {}
  );
  const sourceMetadata = allRecipeSources.map((source) => ({
    id: source.id,
    displayName: source.displayName,
    version: source.version,
    loader: source.loader,
    fileName: source.fileName,
    defaultEnabled: source.defaultEnabled,
    alwaysEnabled: source.alwaysEnabled,
    recipeCount: source.recipeCount,
    supportedRecipeCount: source.supportedRecipeCount,
    unsupportedRecipeCount: source.unsupportedRecipeCount,
    tagCount: source.tagCount
  }));
  const rawRecipes = settings.showUnsupportedRecipesInDebug
    ? allRecipeSources.flatMap((source) => source.recipes)
    : allRecipeSources.flatMap((source) =>
        source.recipes.filter((recipe) => recipe.supported)
      );

  return (
    <div className="industrial-scrollbar grid min-h-0 gap-4 p-4 xl:h-full xl:grid-cols-2 xl:overflow-auto">
      <JsonPanel title={t("debug.recipeExtractionSummary")} value={recipeExtractionSummary} />
      <JsonPanel title={t("debug.loadedSources")} value={sourceMetadata} />
      <JsonPanel title={t("debug.enabledSources")} value={enabledSources.map((source) => source.id)} />
      <JsonPanel title={t("debug.disabledSources")} value={disabledSources.map((source) => source.id)} />
      <JsonPanel title={t("debug.unsupportedRecipes")} value={unsupportedRecipes} />
      <JsonPanel title={t("debug.unsupportedRecipeTypes")} value={unsupportedRecipeTypes} />
      <JsonPanel title={t("debug.recipesByType")} value={getRecipesByType()} />
      <JsonPanel title={t("debug.recipesBySource")} value={getRecipesBySource()} />
      <JsonPanel title={t("debug.rawNormalizedRecipes")} value={rawRecipes} />
      <JsonPanel title={t("debug.rawSourceMetadata")} value={allRecipeSources} />
      <JsonPanel title={t("debug.rawSelectedRecipe")} value={result.selectedRecipe ?? null} />
      <JsonPanel title={t("debug.solverOutput")} value={result} />
      <JsonPanel title={t("debug.graphNodes")} value={result.graph.nodes} />
      <JsonPanel title={t("debug.graphEdges")} value={result.graph.edges} />
      <JsonPanel title={t("debug.formulaBreakdown")} value={result.formulaBreakdown} />
      <JsonPanel title={t("debug.warnings")} value={result.warnings} />
      <JsonPanel title={t("debug.missingData")} value={result.missingData} />
      <JsonPanel title={t("debug.solverUnsupportedTypes")} value={result.unsupportedRecipeTypes} />
      <JsonPanel title={t("debug.settingsSnapshot")} value={settings} />
    </div>
  );
}

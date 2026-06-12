import { useCalculatorStore } from "../../stores/calculatorStore";
import { useSettingsStore } from "../../stores/settingsStore";
import {
  allRecipeSources,
  getRecipesBySource,
  getRecipesByType
} from "../../data/recipeSources";
import { recipeExtractionSummary } from "../../data/generated/recipeExtractionSummary.generated";

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
    <div className="industrial-scrollbar grid min-h-0 gap-4 overflow-auto p-4 xl:grid-cols-2">
      <JsonPanel title="Recipe extraction summary" value={recipeExtractionSummary} />
      <JsonPanel title="Loaded recipe sources" value={sourceMetadata} />
      <JsonPanel title="Enabled recipe sources" value={enabledSources.map((source) => source.id)} />
      <JsonPanel title="Disabled recipe sources" value={disabledSources.map((source) => source.id)} />
      <JsonPanel title="Unsupported extracted recipes" value={unsupportedRecipes} />
      <JsonPanel title="Unsupported recipe types" value={unsupportedRecipeTypes} />
      <JsonPanel title="Recipes by type" value={getRecipesByType()} />
      <JsonPanel title="Recipes by source" value={getRecipesBySource()} />
      <JsonPanel title="Raw normalized recipe JSON" value={rawRecipes} />
      <JsonPanel title="Raw source metadata" value={allRecipeSources} />
      <JsonPanel title="Raw selected recipe JSON" value={result.selectedRecipe ?? null} />
      <JsonPanel title="Solver output JSON" value={result} />
      <JsonPanel title="Graph nodes JSON" value={result.graph.nodes} />
      <JsonPanel title="Graph edges JSON" value={result.graph.edges} />
      <JsonPanel title="Formula breakdown" value={result.formulaBreakdown} />
      <JsonPanel title="Warnings" value={result.warnings} />
      <JsonPanel title="Missing data" value={result.missingData} />
      <JsonPanel title="Solver unsupported recipe types" value={result.unsupportedRecipeTypes} />
      <JsonPanel title="Settings snapshot" value={settings} />
    </div>
  );
}

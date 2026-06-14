import { ChevronDown } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import type { RecipeDefinition } from "../../calculator-core/types";
import { CREATE_BASE_SOURCE_ID } from "../../data/recipeSources";
import { getSourceDisplayName } from "../../data/recipeRegistry";
import { useTranslation } from "../../i18n";
import { useSettingsStore } from "../../stores/settingsStore";
import { ProcessIcon } from "../icons/ProcessIcon";
import {
  formatRecipeFlow,
  getProcessKey,
  getRecipeSearchText
} from "../ui/displayName";
import { EntitySelectorModal, type SelectorRow } from "./EntitySelectorModal";

const ALL_SOURCES = "__all__";

interface RecipeRow extends SelectorRow {
  recipe: RecipeDefinition;
}

interface RecipeSelectorFieldProps {
  label: string;
  value: string;
  recipes: RecipeDefinition[];
  onChange: (value: string) => void;
  icon?: ReactNode;
}

function recipeTitle(
  recipe: RecipeDefinition,
  t: ReturnType<typeof useTranslation>
): string {
  const flow = formatRecipeFlow(recipe);
  const key = getProcessKey(recipe.type);
  return key === "process.unknown" ? flow : `${t(key)}: ${flow}`;
}

/**
 * Recipe selector for Fixed Machines mode. The trigger opens a searchable,
 * virtualized modal with process icons, clean wrapping recipe names, and an
 * addon/source filter. Replaces the old clipped dropdown.
 */
export function RecipeSelectorField({
  label,
  value,
  recipes,
  onChange,
  icon
}: RecipeSelectorFieldProps) {
  const t = useTranslation();
  const developerMode = useSettingsStore((state) => state.developerMode);
  const [open, setOpen] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<string>(ALL_SOURCES);

  const sourceOptions = useMemo(() => {
    const present = new Set<string>();
    for (const recipe of recipes) {
      present.add(recipe.sourceId ?? CREATE_BASE_SOURCE_ID);
    }
    const options = [...present].map((id) => ({
      value: id,
      label: getSourceDisplayName(id)
    }));
    return [{ value: ALL_SOURCES, label: t("factory.allSources") }, ...options];
  }, [recipes, t]);

  const rows = useMemo<RecipeRow[]>(() => {
    return recipes
      .filter(
        (recipe) =>
          sourceFilter === ALL_SOURCES ||
          (recipe.sourceId ?? CREATE_BASE_SOURCE_ID) === sourceFilter
      )
      .map((recipe) => ({
        value: recipe.id,
        recipe,
        searchText: getRecipeSearchText(recipe, [
          getSourceDisplayName(recipe.sourceId ?? CREATE_BASE_SOURCE_ID)
        ])
      }));
  }, [recipes, sourceFilter]);

  const selectedRecipe = recipes.find((recipe) => recipe.id === value);
  const selectedLabel = selectedRecipe ? recipeTitle(selectedRecipe, t) : value;

  return (
    <div className="grid gap-1.5 text-sm text-stone-300">
      <span className="flex items-center gap-2 text-xs uppercase tracking-wide text-stone-500">
        {icon}
        {label}
      </span>
      <button
        type="button"
        className="create-control flex h-10 w-full items-center justify-between gap-2 px-3 text-left text-sm text-stone-100 outline-none transition focus:border-factory-brass"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        <span className="flex min-w-0 items-center gap-2">
          {selectedRecipe ? (
            <ProcessIcon type={selectedRecipe.type} size={14} />
          ) : null}
          <span className="truncate">{selectedLabel}</span>
        </span>
        <ChevronDown size={16} className="shrink-0 text-stone-400" />
      </button>

      <EntitySelectorModal<RecipeRow>
        open={open}
        onClose={() => setOpen(false)}
        title={t("selector.selectRecipe")}
        searchPlaceholder={t("factory.searchRecipes")}
        value={value}
        rows={rows}
        emptyText={t("factory.noRecipesFound")}
        sourceFilter={
          sourceOptions.length > 2
            ? {
                value: sourceFilter,
                onChange: setSourceFilter,
                options: sourceOptions
              }
            : undefined
        }
        onSelect={onChange}
        rowHeight={64}
        renderRow={(row) => {
          const recipe = row.recipe;
          const sourceId = recipe.sourceId ?? CREATE_BASE_SOURCE_ID;
          const showBadge = sourceId !== CREATE_BASE_SOURCE_ID;
          return (
            <>
              <ProcessIcon type={recipe.type} size={18} />
              <span className="min-w-0 flex-1">
                <span className="block break-words font-semibold text-stone-100">
                  {recipeTitle(recipe, t)}
                </span>
                {developerMode ? (
                  <span className="block break-all text-[11px] text-stone-500">
                    {recipe.id}
                  </span>
                ) : null}
              </span>
              {showBadge ? (
                <span className="shrink-0 rounded border border-factory-border px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-stone-500">
                  {getSourceDisplayName(sourceId)}
                </span>
              ) : null}
            </>
          );
        }}
      />
    </div>
  );
}

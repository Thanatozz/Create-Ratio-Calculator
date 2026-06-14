import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import {
  CREATE_BASE_SOURCE_ID,
  allRecipeSources
} from "../../data/recipeSources";
import {
  getActiveRegistry,
  getSourceDisplayName
} from "../../data/recipeRegistry";
import { useTranslation } from "../../i18n";
import { useSettingsStore } from "../../stores/settingsStore";
import { CreateIcon } from "../icons/CreateIcon";
import { formatItemDisplayName, getItemSearchText } from "../ui/displayName";
import { EntitySelectorModal, type SelectorRow } from "./EntitySelectorModal";

const ALL_SOURCES = "__all__";

interface ItemRow extends SelectorRow {
  itemId: string;
  sourceIds: string[];
  fromCreateBase: boolean;
}

interface TargetItemFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

/**
 * Target item selector. The labelled trigger opens a searchable, virtualized
 * modal (full-screen on mobile) with an addon/source filter. Item options come
 * from the active recipe registry; names are cleaned and never shown as raw ids.
 */
export function TargetItemField({ label, value, onChange }: TargetItemFieldProps) {
  const t = useTranslation();
  const enabledRecipeSourceIds = useSettingsStore(
    (state) => state.enabledRecipeSourceIds
  );
  const developerMode = useSettingsStore((state) => state.developerMode);
  const registry = getActiveRegistry(enabledRecipeSourceIds);

  const [open, setOpen] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<string>(ALL_SOURCES);

  const sourceOptions = useMemo(() => {
    const enabled = new Set(enabledRecipeSourceIds);
    const contributing = new Set<string>();
    for (const entry of registry.targetItems) {
      for (const sourceId of entry.sourceIds) {
        contributing.add(sourceId);
      }
    }
    const addonOptions = allRecipeSources
      .filter(
        (source) =>
          source.id !== CREATE_BASE_SOURCE_ID &&
          enabled.has(source.id) &&
          contributing.has(source.id)
      )
      .map((source) => ({ value: source.id, label: getSourceDisplayName(source.id) }));

    return [
      { value: ALL_SOURCES, label: t("factory.allSources") },
      { value: CREATE_BASE_SOURCE_ID, label: getSourceDisplayName(CREATE_BASE_SOURCE_ID) },
      ...addonOptions
    ];
  }, [enabledRecipeSourceIds, registry.targetItems, t]);

  const rows = useMemo<ItemRow[]>(() => {
    return registry.targetItems
      .filter(
        (entry) =>
          sourceFilter === ALL_SOURCES || entry.sourceIds.includes(sourceFilter)
      )
      .map((entry) => ({
        value: entry.itemId,
        itemId: entry.itemId,
        sourceIds: entry.sourceIds,
        fromCreateBase: entry.fromCreateBase,
        searchText: getItemSearchText(
          entry.itemId,
          entry.sourceIds.map((id) => getSourceDisplayName(id))
        )
      }));
  }, [registry.targetItems, sourceFilter]);

  const selectedLabel = formatItemDisplayName(value) || value;

  return (
    <div className="grid gap-1.5 text-sm text-stone-300">
      <span className="flex items-center gap-2 text-xs uppercase tracking-wide text-stone-500">
        <CreateIcon id={value} />
        {label}
      </span>
      <button
        type="button"
        className="create-control flex h-10 w-full items-center justify-between gap-2 px-3 text-left text-sm text-stone-100 outline-none transition focus:border-factory-brass"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown size={16} className="shrink-0 text-stone-400" />
      </button>

      <EntitySelectorModal<ItemRow>
        open={open}
        onClose={() => setOpen(false)}
        title={t("selector.selectTargetItem")}
        searchPlaceholder={t("factory.searchItems")}
        value={value}
        rows={rows}
        emptyText={t("factory.noItemsFound")}
        sourceFilter={{
          value: sourceFilter,
          onChange: setSourceFilter,
          options: sourceOptions
        }}
        onSelect={onChange}
        renderRow={(row) => {
          const addonSource = row.sourceIds.find(
            (sourceId) => sourceId !== CREATE_BASE_SOURCE_ID
          );
          const showBadge = !row.fromCreateBase && addonSource;
          return (
            <>
              <CreateIcon id={row.itemId} />
              <span className="min-w-0 flex-1">
                <span className="block break-words font-semibold text-stone-100">
                  {formatItemDisplayName(row.itemId)}
                </span>
                {developerMode ? (
                  <span className="block break-all text-[11px] text-stone-500">
                    {row.itemId}
                  </span>
                ) : null}
              </span>
              {showBadge ? (
                <span className="shrink-0 rounded border border-factory-border px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-stone-500">
                  {getSourceDisplayName(addonSource)}
                </span>
              ) : null}
            </>
          );
        }}
      />
    </div>
  );
}

import { Lock } from "lucide-react";
import type { RecipeSource } from "../../calculator-core/types";
import {
  cleanSourceDisplayName,
  isMandatoryText
} from "../ui/displayName";
import { useTranslation } from "../../i18n";

interface RecipeSourceCardProps {
  source: RecipeSource;
  checked: boolean;
  locked: boolean;
  compact?: boolean;
  onChange: (checked: boolean) => void;
}

/** Compact, mobile-friendly recipe-source row with cleaned name + counts. */
export function RecipeSourceCard({
  source,
  checked,
  locked,
  compact = false,
  onChange
}: RecipeSourceCardProps) {
  const t = useTranslation();
  const name = cleanSourceDisplayName(source.displayName);
  const mandatory =
    isMandatoryText(source.displayName) || isMandatoryText(source.version);
  const supported = source.supportedRecipeCount ?? source.recipeCount;
  const unsupported =
    source.unsupportedRecipeCount ?? Math.max(0, source.recipeCount - supported);

  const counts = [
    t("settings.countRecipes", { count: source.recipeCount }),
    t("settings.countSupported", { count: supported }),
    unsupported > 0 ? t("settings.countUnsupported", { count: unsupported }) : null
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <label
      className={`flex items-start gap-3 rounded-md border bg-factory-panel2 p-3 text-sm text-stone-300 ${
        locked ? "border-factory-brass/70" : "border-factory-border"
      }`}
    >
      <input
        type="checkbox"
        className="mt-0.5 h-5 w-5 shrink-0"
        checked={checked}
        disabled={locked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="break-words font-semibold text-stone-100">{name}</span>
          {locked ? (
            <span className="inline-flex items-center gap-1 rounded border border-factory-brass/60 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-factory-brass">
              <Lock size={10} />
              {t("common.locked")}
            </span>
          ) : null}
          {mandatory ? (
            <span className="rounded border border-factory-warning/50 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-factory-warning">
              {t("settings.mandatory")}
            </span>
          ) : null}
        </span>
        {!compact ? (
          <span className="mt-0.5 block text-xs text-stone-500">{counts}</span>
        ) : null}
      </span>
    </label>
  );
}

import type { RecipeDefinition } from "../../calculator-core/types";
import { itemById } from "../../data/create-1.21.1/items";

/**
 * Display-name normalisation layer.
 *
 * These helpers turn raw Minecraft/Create recipe and item identifiers into
 * clean, human-readable labels for the normal UI. Internal ids are never
 * modified - only their presentation. Raw ids should only be shown to users in
 * Developer Mode.
 */

const KNOWN_PROCESS_LABELS: Record<string, string> = {
  crushing: "Crushing",
  milling: "Milling",
  mixing: "Mixing",
  pressing: "Pressing",
  compacting: "Compacting",
  washing: "Washing",
  splashing: "Washing",
  haunting: "Haunting",
  smoking: "Smoking",
  blasting: "Blasting",
  smelting: "Smelting",
  cutting: "Cutting",
  sawing: "Cutting",
  deploying: "Deploying",
  filling: "Filling",
  emptying: "Emptying",
  draining: "Emptying",
  spouting: "Filling",
  sandpaper_polishing: "Polishing",
  polishing: "Polishing",
  item_application: "Item Application",
  sequenced_assembly: "Sequenced Assembly",
  mechanical_crafting: "Mechanical Crafting",
  crafting: "Crafting",
  crafting_shaped: "Crafting",
  crafting_shapeless: "Crafting"
};

const VERSION_SUFFIX = /[:_-]?\b\d+\.\d+(?:\.\d+)?\b$/;

/** Strip a trailing Minecraft version suffix such as `:1.21.1` or `_1.21`. */
export function stripVersionSuffix(value: string): {
  value: string;
  version?: string;
} {
  const match = value.match(VERSION_SUFFIX);
  if (!match) {
    return { value };
  }

  return {
    value: value.slice(0, match.index).replace(/[:_-]+$/, ""),
    version: match[0].replace(/^[:_-]+/, "")
  };
}

/** Turn a single snake/kebab token into Title Case words. */
export function humanizeToken(token: string): string {
  const cleaned = token
    .replace(/[#]/g, "")
    .replace(/[._/-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) {
    return "";
  }

  return cleaned
    .split(" ")
    .map((word) =>
      word.length === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");
}

/**
 * Format an item id (or tag) into a clean display name.
 *
 * - Prefers curated names from the Create base item table.
 * - Falls back to a humanised version of the id's last path segment.
 */
export function formatItemDisplayName(itemId: string, _locale?: string): string {
  if (!itemId) {
    return "";
  }

  // `_locale` is reserved for a future localized item-name map; today all
  // languages fall back to curated/clean English names (never raw ids).
  const curated = itemById[itemId]?.name;
  if (curated) {
    return curated;
  }

  const isTag = itemId.startsWith("#");
  const { value } = stripVersionSuffix(itemId.replace(/^#/, ""));

  // Take the most specific segment: after the last "/" or namespace ":".
  const lastSlash = value.split("/").pop() ?? value;
  const lastSegment = lastSlash.includes(":")
    ? (lastSlash.split(":").pop() ?? lastSlash)
    : lastSlash;

  const label = humanizeToken(lastSegment) || humanizeToken(value) || itemId;
  return isTag ? `${label} (tag)` : label;
}

export interface NormalizedRecipeId {
  /** The original id, never altered. */
  raw: string;
  namespace: string;
  /** Remaining path after the namespace, version-stripped. */
  path: string;
  /** Detected Create process (e.g. "crushing"), if any. */
  process?: string;
  version?: string;
  /** Best-effort input/output hints parsed from synthetic `a->b` ids. */
  inputHint?: string;
  outputHint?: string;
}

/**
 * Parse a raw recipe id into a stable structured shape for display purposes.
 * Handles version suffixes and malformed synthetic ids that contain arrows.
 */
export function normalizeRecipeId(rawId: string): NormalizedRecipeId {
  const raw = rawId ?? "";
  const arrowsCollapsed = raw.replace(/-+>/g, "->").replace(/\s*->\s*/g, "->");

  let inputHint: string | undefined;
  let outputHint: string | undefined;
  let core = arrowsCollapsed;

  if (arrowsCollapsed.includes("->")) {
    const parts = arrowsCollapsed
      .split("->")
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length > 0) {
      inputHint = formatItemDisplayName(parts[0]);
      outputHint = formatItemDisplayName(parts[parts.length - 1]);
      // Use the first segment to derive namespace/process metadata.
      core = parts[0];
    }
  }

  const { value: versionless, version } = stripVersionSuffix(core);
  const [namespace = "", ...rest] = versionless.split(":");
  const path = rest.join(":") || versionless;
  const processSegment = path.split("/")[0]?.toLowerCase();
  const process =
    processSegment && KNOWN_PROCESS_LABELS[processSegment]
      ? processSegment
      : undefined;

  return {
    raw,
    namespace,
    path,
    process,
    version,
    inputHint,
    outputHint
  };
}

/** Resolve a process key/type into a friendly label, if known. */
export function getProcessLabel(processOrType?: string): string | undefined {
  if (!processOrType) {
    return undefined;
  }

  const key = (processOrType.split(":").pop() ?? processOrType).toLowerCase();
  return KNOWN_PROCESS_LABELS[key];
}

/**
 * Clean an arbitrary, possibly malformed generated recipe name/id into a safe
 * human-readable string. Collapses duplicate arrows, strips version suffixes
 * and namespaces, and title-cases the remaining tokens.
 */
export function cleanGeneratedRecipeName(rawName: string): string {
  if (!rawName) {
    return "";
  }

  const normalized = normalizeRecipeId(rawName);

  if (normalized.inputHint && normalized.outputHint) {
    const process = getProcessLabel(normalized.process);
    const flow = `${normalized.inputHint} → ${normalized.outputHint}`;
    return process ? `${process}: ${flow}` : flow;
  }

  const process = getProcessLabel(normalized.process);
  const lastSegment = normalized.path.split("/").pop() ?? normalized.path;
  const subject = humanizeToken(lastSegment) || humanizeToken(normalized.path);

  if (!subject) {
    return rawName;
  }

  return process ? `${process}: ${subject}` : subject;
}

type RecipeLike =
  | RecipeDefinition
  | {
      id: string;
      type?: string;
      category?: string;
      input?: { itemId: string }[];
      outputs?: { itemId: string }[];
    };

/**
 * Format a recipe into a clean display name.
 *
 * - With inputs and outputs: `Crushing: Cobblestone → Gravel` (process prefix
 *   only when a known Create process is detected), otherwise `Cobblestone → Gravel`.
 * - With only an id (e.g. a byproduct's source recipe): best-effort cleanup.
 */
export function formatRecipeDisplayName(recipe: RecipeLike, _locale?: string): string {
  const inputs = (recipe.input ?? [])
    .map((entry) => formatItemDisplayName(entry.itemId))
    .filter(Boolean);
  const outputs = (recipe.outputs ?? [])
    .map((entry) => formatItemDisplayName(entry.itemId))
    .filter(Boolean);

  const process = getProcessLabel(recipe.type ?? recipe.category ?? recipe.id);

  if (inputs.length > 0 && outputs.length > 0) {
    const flow = `${inputs.join(" + ")} → ${outputs.join(" + ")}`;
    return process ? `${process}: ${flow}` : flow;
  }

  if (outputs.length > 0) {
    const subject = outputs.join(" + ");
    return process ? `${process}: ${subject}` : subject;
  }

  return cleanGeneratedRecipeName(recipe.id);
}

/**
 * Map a raw process/recipe-type segment to a canonical process key used for
 * icons and i18n. Fan variants collapse to their distinct process.
 */
const PROCESS_ALIASES: Record<string, string> = {
  crushing: "crushing",
  milling: "milling",
  mixing: "mixing",
  pressing: "pressing",
  compacting: "compacting",
  deploying: "deploying",
  cutting: "cutting",
  sawing: "cutting",
  mechanical_crafting: "mechanical_crafting",
  crafting: "crafting",
  crafting_shaped: "crafting",
  crafting_shapeless: "crafting",
  filling: "filling",
  spouting: "filling",
  emptying: "emptying",
  draining: "emptying",
  washing: "washing",
  splashing: "washing",
  fan_washing: "washing",
  haunting: "haunting",
  fan_haunting: "haunting",
  smoking: "smoking",
  fan_smoking: "smoking",
  blasting: "blasting",
  fan_blasting: "blasting",
  smelting: "smelting",
  freezing: "freezing",
  fan_freezing: "freezing",
  sandpaper_polishing: "sanding",
  polishing: "sanding",
  sanding: "sanding",
  item_application: "item_application",
  sequenced_assembly: "sequenced_assembly",
  fan_processing: "fan_processing",
  encased_fan: "fan_processing"
};

/** Resolve a raw process/recipe-type into a canonical process key, if known. */
export function canonicalProcess(processOrType?: string): string | undefined {
  if (!processOrType) {
    return undefined;
  }
  const key = (processOrType.split(":").pop() ?? processOrType).toLowerCase();
  return PROCESS_ALIASES[key];
}

/** i18n key for a process/recipe-type, e.g. "process.crushing" or "process.unknown". */
export function getProcessKey(processOrType?: string): string {
  const canon = canonicalProcess(processOrType);
  return canon ? `process.${canon}` : "process.unknown";
}

/** Just the input→output flow string of a recipe (no process prefix). */
export function formatRecipeFlow(recipe: RecipeLike): string {
  const inputs = (recipe.input ?? [])
    .map((entry) => formatItemDisplayName(entry.itemId))
    .filter(Boolean);
  const outputs = (recipe.outputs ?? [])
    .map((entry) => formatItemDisplayName(entry.itemId))
    .filter(Boolean);

  if (inputs.length > 0 && outputs.length > 0) {
    return `${inputs.join(" + ")} → ${outputs.join(" + ")}`;
  }
  if (outputs.length > 0) {
    return outputs.join(" + ");
  }
  return cleanGeneratedRecipeName(recipe.id);
}

/** Lowercased search haystack for an item row (name + id + namespace + extras). */
export function getItemSearchText(itemId: string, extras: string[] = []): string {
  const namespace = itemId.split(":")[0] ?? "";
  return [formatItemDisplayName(itemId), itemId, namespace, ...extras]
    .join(" ")
    .toLowerCase();
}

/** Lowercased search haystack for a recipe row (process + items + ids + extras). */
export function getRecipeSearchText(recipe: RecipeLike, extras: string[] = []): string {
  const inputs = recipe.input ?? [];
  const outputs = recipe.outputs ?? [];
  const parts = [
    getProcessLabel(recipe.type ?? recipe.category ?? recipe.id) ?? "",
    recipe.id,
    recipe.id.split(":")[0] ?? "",
    ...inputs.map((entry) => `${formatItemDisplayName(entry.itemId)} ${entry.itemId}`),
    ...outputs.map((entry) => `${formatItemDisplayName(entry.itemId)} ${entry.itemId}`),
    ...extras
  ];
  return parts.join(" ").toLowerCase();
}

/** Pure fallback used to humanise an unknown recipe-source id. */
export function humanizeSourceId(sourceId: string): string {
  if (!sourceId) {
    return "";
  }
  if (sourceId === "create_base") {
    return "Create Base";
  }
  const { value } = stripVersionSuffix(sourceId);
  return humanizeToken(value) || sourceId;
}

/**
 * Clean a raw recipe-source display name. Extracted mod metadata sometimes
 * carries stray quotes and dependency markers such as `Create: Factory" #mandatory`.
 */
export function cleanSourceDisplayName(name: string): string {
  if (!name) {
    return "";
  }
  return name
    .replace(/#\s*mandatory/gi, "")
    .replace(/["']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Whether a source value (name or version string) is flagged as a mandatory dependency. */
export function isMandatoryText(value: string | undefined): boolean {
  return Boolean(value && /#\s*mandatory/i.test(value));
}

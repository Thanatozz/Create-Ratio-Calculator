import type {
  NormalizedCondition,
  NormalizedFluidIngredient,
  NormalizedFluidOutput,
  NormalizedIngredient,
  NormalizedOutput,
  NormalizedRecipe,
  NormalizedTag
} from "../../src/calculator-core/types";
import type { RawRecipeEntry, RawTagEntry } from "./types";

const recipeMachineByType: Record<string, string | undefined> = {
  "create:crushing": "create:crushing_wheel_pair",
  "create:milling": "create:millstone",
  "create:mixing": "create:mechanical_mixer",
  "create:compacting": "create:mechanical_press",
  "create:pressing": "create:mechanical_press",
  "create:cutting": "create:mechanical_saw",
  "create:deploying": "create:deployer",
  "create:splashing": "create:encased_fan_washing",
  "create:haunting": "create:encased_fan_haunting"
};

const knownRecipeTypes = new Set([
  ...Object.keys(recipeMachineByType),
  "create:sequenced_assembly",
  "minecraft:crafting_shaped",
  "minecraft:crafting_shapeless",
  "minecraft:smelting",
  "minecraft:blasting",
  "minecraft:smoking"
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }
  return value === undefined ? [] : [value];
}

function readItemId(value: Record<string, unknown>): string | undefined {
  if (typeof value.item === "string") {
    return value.item;
  }

  if (isRecord(value.item) && typeof value.item.id === "string") {
    return value.item.id;
  }

  return typeof value.id === "string" ? value.id : undefined;
}

function readFluidId(value: Record<string, unknown>): string | undefined {
  if (typeof value.fluid === "string") {
    return value.fluid;
  }

  if (isRecord(value.fluid) && typeof value.fluid.id === "string") {
    return value.fluid.id;
  }

  return undefined;
}

function normalizeIngredient(value: unknown): NormalizedIngredient[] {
  if (Array.isArray(value)) {
    return value.flatMap(normalizeIngredient);
  }

  if (!isRecord(value)) {
    return [];
  }

  if (Array.isArray(value.ingredient)) {
    return value.ingredient.flatMap(normalizeIngredient);
  }

  if (isRecord(value.ingredient)) {
    return normalizeIngredient(value.ingredient);
  }

  const count = typeof value.count === "number" ? value.count : 1;
  const itemId = readItemId(value);
  const tag = typeof value.tag === "string" ? value.tag : undefined;

  if (!itemId && !tag) {
    return [];
  }

  return [{ itemId, tag, count, raw: value }];
}

function normalizeOutput(value: unknown): NormalizedOutput[] {
  if (Array.isArray(value)) {
    return value.flatMap(normalizeOutput);
  }

  if (!isRecord(value)) {
    return [];
  }

  const itemId = readItemId(value);
  const fluidId = readFluidId(value);
  const count =
    typeof value.count === "number"
      ? value.count
      : typeof value.amount === "number"
        ? value.amount
        : 1;
  const chance = typeof value.chance === "number" ? value.chance : 1;

  if (!itemId && !fluidId) {
    return [];
  }

  return [{ itemId, fluidId, count, chance, raw: value }];
}

function normalizeFluidIngredient(value: unknown): NormalizedFluidIngredient[] {
  if (Array.isArray(value)) {
    return value.flatMap(normalizeFluidIngredient);
  }

  if (!isRecord(value)) {
    return [];
  }

  if (Array.isArray(value.ingredient)) {
    return value.ingredient.flatMap(normalizeFluidIngredient);
  }

  if (isRecord(value.ingredient)) {
    return normalizeFluidIngredient(value.ingredient);
  }

  const fluidId = readFluidId(value);
  if (!fluidId) {
    return [];
  }

  const amountMb =
    typeof value.amount === "number"
      ? value.amount
      : typeof value.count === "number"
        ? value.count
        : 1;

  return [{ fluidId, amountMb, raw: value }];
}

function normalizeFluidOutput(value: unknown): NormalizedFluidOutput[] {
  if (Array.isArray(value)) {
    return value.flatMap(normalizeFluidOutput);
  }

  if (!isRecord(value)) {
    return [];
  }

  const fluidId = readFluidId(value);
  if (!fluidId) {
    return [];
  }

  const amountMb =
    typeof value.amount === "number"
      ? value.amount
      : typeof value.count === "number"
        ? value.count
        : 1;

  return [{ fluidId, amountMb, raw: value }];
}

function ingredientsFromCraftingKey(raw: Record<string, unknown>): unknown[] {
  if (!isRecord(raw.key) || !Array.isArray(raw.pattern)) {
    return [];
  }

  return raw.pattern.flatMap((row) =>
    typeof row === "string"
      ? [...row].flatMap((symbol) => {
          if (symbol === " ") {
            return [];
          }
          return raw.key && isRecord(raw.key) ? [raw.key[symbol]] : [];
        })
      : []
  );
}

function extractInputs(raw: Record<string, unknown>): NormalizedIngredient[] {
  const ingredients =
    raw.ingredients ??
    raw.ingredient ??
    raw.inputs ??
    raw.input ??
    ingredientsFromCraftingKey(raw);

  return asArray(ingredients).flatMap(normalizeIngredient);
}

function extractOutputs(raw: Record<string, unknown>): NormalizedOutput[] {
  const results = raw.results ?? raw.result ?? raw.outputs ?? raw.output;
  return asArray(results).flatMap(normalizeOutput);
}

function extractFluidInputs(raw: Record<string, unknown>): NormalizedFluidIngredient[] {
  const ingredients = raw.ingredients ?? raw.ingredient ?? raw.inputs ?? raw.input;
  return asArray(ingredients).flatMap(normalizeFluidIngredient);
}

function extractFluidOutputs(raw: Record<string, unknown>): NormalizedFluidOutput[] {
  const results = raw.results ?? raw.result ?? raw.outputs ?? raw.output;
  return asArray(results).flatMap(normalizeFluidOutput);
}

function extractConditions(raw: Record<string, unknown>): NormalizedCondition[] {
  const conditions =
    raw.conditions ?? raw["forge:conditions"] ?? raw["neoforge:conditions"];

  return asArray(conditions)
    .filter(isRecord)
    .map((condition) => ({
      type: typeof condition.type === "string" ? condition.type : "unknown",
      raw: condition
    }));
}

export function normalizeRecipe(
  sourceId: string,
  recipe: RawRecipeEntry
): NormalizedRecipe {
  const raw = isRecord(recipe.raw) ? recipe.raw : {};
  const type = typeof raw.type === "string" ? raw.type : "unknown";
  const machineId = recipeMachineByType[type];
  const processingTime =
    typeof raw.processingTime === "number"
      ? raw.processingTime
      : typeof raw.processing_time === "number"
        ? raw.processing_time
        : undefined;
  const supported = knownRecipeTypes.has(type) && Boolean(machineId);
  const heatRequirement =
    raw.heatRequirement === "heated" || raw.heatRequirement === "superheated"
      ? raw.heatRequirement
      : raw.heat_requirement === "heated" || raw.heat_requirement === "superheated"
        ? raw.heat_requirement
        : "none";

  return {
    id: recipe.id,
    sourceId,
    namespace: recipe.namespace,
    path: recipe.path,
    type,
    inputs: extractInputs(raw),
    outputs: extractOutputs(raw),
    processingTimeTicks: processingTime,
    machineId,
    heatRequirement,
    fluidInputs: extractFluidInputs(raw),
    fluidOutputs: extractFluidOutputs(raw),
    conditions: extractConditions(raw),
    raw: recipe.raw,
    supported,
    unsupportedReason: supported
      ? undefined
      : knownRecipeTypes.has(type)
        ? "Recipe type parsed but no solver machine is mapped yet."
        : `Unsupported recipe type: ${type}`
  };
}

export function normalizeTag(
  sourceId: string,
  tag: RawTagEntry
): NormalizedTag {
  const raw = isRecord(tag.raw) ? tag.raw : {};
  const values = Array.isArray(raw.values)
    ? raw.values.filter((value): value is string => typeof value === "string")
    : [];

  return {
    id: tag.id,
    sourceId,
    namespace: tag.namespace,
    path: tag.path,
    type: tag.type,
    values,
    raw: tag.raw
  };
}

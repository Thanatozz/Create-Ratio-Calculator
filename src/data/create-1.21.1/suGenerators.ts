import type { SuGeneratorDefinition } from "../../calculator-core/types";

export const CREATIVE_GENERATOR_ID = "create:creative_motor";
export const SMALL_ACTIVE_STEAM_ENGINE_ID = "create:steam_engine_small_active";
export const ACTIVE_STEAM_ENGINE_ID = "create:steam_engine_active";
export const MAX_HEATED_STEAM_ENGINE_ID = "create:steam_engine_max_heated";
export const SUPERHEATED_BOILER_ID = "create:superheated_boiler_lv18";

export const suGenerators: SuGeneratorDefinition[] = [
  {
    id: "create:water_wheel",
    name: "Water Wheel",
    level: "-",
    suCapacity: 256,
    category: "early_game"
  },
  {
    id: "create:large_water_wheel",
    name: "Large Water Wheel",
    level: "-",
    suCapacity: 512,
    category: "early_game"
  },
  {
    id: "create:windmill_bearing",
    name: "Windmill Bearing",
    level: "-",
    suCapacity: 4096,
    category: "mid_game",
    configurable: true,
    notes: "Capacity depends on sails and configuration."
  },
  {
    id: "create:steam_engine_passive",
    name: "Passive Steam Engine",
    level: "0",
    suCapacity: 2048,
    category: "mid_game",
    notes: "Passive boiler setup."
  },
  {
    id: SMALL_ACTIVE_STEAM_ENGINE_ID,
    name: "Small Active Steam Engine",
    level: "1",
    suCapacity: 16384,
    category: "late_game",
    notes: "Small active boiler setup."
  },
  {
    id: ACTIVE_STEAM_ENGINE_ID,
    name: "Active Steam Engine",
    level: "4",
    suCapacity: 65536,
    category: "late_game",
    notes: "Active boiler setup."
  },
  {
    id: MAX_HEATED_STEAM_ENGINE_ID,
    name: "Max Heated Steam Engine",
    level: "9",
    suCapacity: 147456,
    category: "late_game",
    notes: "Max-level heated boiler setup."
  },
  {
    id: SUPERHEATED_BOILER_ID,
    name: "Max Superheated Steam Engine",
    level: "18",
    suCapacity: 294912,
    category: "late_game",
    notes: "Max-level superheated boiler setup."
  },
  {
    id: CREATIVE_GENERATOR_ID,
    name: "Creative Generator",
    level: "Creative",
    suCapacity: 1000000000,
    category: "creative",
    configurable: true,
    notes: "Treated as effectively unlimited for planning."
  }
];

export const normalSuGenerators = suGenerators.filter(
  (generator) => generator.category !== "creative"
);

export function getVisibleSuGenerators(
  showCreativeGenerator: boolean
): SuGeneratorDefinition[] {
  return showCreativeGenerator ? suGenerators : normalSuGenerators;
}

export function isCreativeGeneratorId(generatorId: string): boolean {
  return generatorId === CREATIVE_GENERATOR_ID;
}

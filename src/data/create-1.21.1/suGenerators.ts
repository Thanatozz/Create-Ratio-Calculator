import type { SuGeneratorDefinition } from "../../calculator-core/types";

export const suGenerators: SuGeneratorDefinition[] = [
  {
    id: "create:water_wheel",
    name: "Water Wheel",
    suCapacity: 256,
    category: "early_game"
  },
  {
    id: "create:large_water_wheel",
    name: "Large Water Wheel",
    suCapacity: 512,
    category: "early_game"
  },
  {
    id: "create:windmill_bearing",
    name: "Windmill Bearing",
    suCapacity: 4096,
    category: "mid_game",
    configurable: true,
    notes: "Capacity depends on sails and configuration."
  },
  {
    id: "create:steam_engine_passive",
    name: "Steam Engine Passive",
    suCapacity: 2048,
    category: "mid_game"
  },
  {
    id: "create:steam_engine_active",
    name: "Steam Engine Active",
    suCapacity: 16384,
    category: "late_game"
  },
  {
    id: "create:creative_motor",
    name: "Creative Motor",
    suCapacity: 1000000000,
    category: "creative",
    configurable: true,
    notes: "Treated as effectively unlimited for planning."
  }
];

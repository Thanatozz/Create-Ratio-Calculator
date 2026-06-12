import type { RecipeDefinition } from "../../calculator-core/types";

export const recipes: RecipeDefinition[] = [
  {
    id: "create:drilling/cobblestone_generator",
    type: "create:physical_source",
    category: "physical_generation",
    input: [],
    outputs: [{ itemId: "minecraft:cobblestone", count: 1, chance: 1 }],
    processingTimeTicks: 1,
    machineId: "create:mechanical_drill",
    notes:
      "Fixed-machine entry for Cobblestone Generator + Mechanical Drill. Throughput is handled by the drill calculator."
  },
  {
    id: "create:crushing/cobblestone",
    type: "create:crushing",
    category: "crushing",
    input: [{ itemId: "minecraft:cobblestone", count: 1 }],
    outputs: [{ itemId: "minecraft:gravel", count: 1, chance: 1 }],
    processingTimeTicks: 250,
    machineId: "create:crushing_wheel_pair",
    stackProcessing: true,
    notes: "Crushing wheel stack processing path."
  },
  {
    id: "create:crushing/gravel",
    type: "create:crushing",
    category: "crushing",
    input: [{ itemId: "minecraft:gravel", count: 1 }],
    outputs: [
      { itemId: "minecraft:sand", count: 1, chance: 1 },
      { itemId: "minecraft:flint", count: 1, chance: 0.25 }
    ],
    processingTimeTicks: 250,
    machineId: "create:crushing_wheel_pair",
    stackProcessing: true
  },
  {
    id: "create:milling/wheat",
    type: "create:milling",
    category: "milling",
    input: [{ itemId: "minecraft:wheat", count: 1 }],
    outputs: [{ itemId: "create:wheat_flour", count: 1, chance: 1 }],
    processingTimeTicks: 100,
    machineId: "create:millstone",
    notes: "Starter millstone recipe for fixed-machine planning."
  },
  {
    id: "create:pressing/iron_ingot",
    type: "create:pressing",
    category: "pressing",
    input: [{ itemId: "minecraft:iron_ingot", count: 1 }],
    outputs: [{ itemId: "create:iron_sheet", count: 1, chance: 1 }],
    processingTimeTicks: 100,
    machineId: "create:mechanical_press"
  },
  {
    id: "create:mixing/andesite_alloy",
    type: "create:mixing",
    category: "mixing",
    input: [
      { itemId: "minecraft:andesite", count: 1 },
      { itemId: "minecraft:iron_nugget", count: 1 }
    ],
    outputs: [{ itemId: "create:andesite_alloy", count: 1, chance: 1 }],
    processingTimeTicks: 100,
    machineId: "create:mechanical_mixer",
    notes: "Represents the Create mixing route; crafting route can be added later."
  },
  {
    id: "create:mixing/brass_ingot",
    type: "create:mixing",
    category: "mixing",
    input: [
      { itemId: "minecraft:copper_ingot", count: 1 },
      { itemId: "create:zinc_ingot", count: 1 }
    ],
    outputs: [{ itemId: "create:brass_ingot", count: 2, chance: 1 }],
    processingTimeTicks: 100,
    machineId: "create:mechanical_mixer",
    requiredHeat: "heated"
  },
  {
    id: "create:cutting/oak_log",
    type: "create:cutting",
    category: "cutting",
    input: [{ itemId: "minecraft:oak_log", count: 1 }],
    outputs: [{ itemId: "minecraft:oak_planks", count: 6, chance: 1 }],
    processingTimeTicks: 100,
    machineId: "create:mechanical_saw",
    notes: "Starter Mechanical Saw recipe. Modpack yields can vary."
  },
  {
    id: "create:fan_washing/sand",
    type: "create:fan_washing",
    category: "bulk_washing",
    input: [{ itemId: "minecraft:sand", count: 1 }],
    outputs: [{ itemId: "minecraft:clay_ball", count: 1, chance: 1 }],
    processingTimeTicks: 100,
    machineId: "create:encased_fan_washing",
    notes: "Starter fan washing recipe. Exact Create recipes can vary by pack."
  },
  {
    id: "create:fan_haunting/sand",
    type: "create:fan_haunting",
    category: "bulk_haunting",
    input: [{ itemId: "minecraft:sand", count: 1 }],
    outputs: [{ itemId: "minecraft:soul_sand", count: 1, chance: 1 }],
    processingTimeTicks: 100,
    machineId: "create:encased_fan_haunting",
    notes: "Starter Encased Fan haunting recipe for fixed-machine planning."
  },
  {
    id: "create:sequenced_assembly/precision_mechanism_placeholder",
    type: "create:sequenced_assembly",
    category: "sequenced_assembly",
    input: [
      { itemId: "create:golden_sheet", count: 1 },
      { itemId: "create:cogwheel", count: 1 },
      { itemId: "create:andesite_alloy", count: 1 }
    ],
    outputs: [{ itemId: "create:precision_mechanism", count: 1, chance: 0.8 }],
    processingTimeTicks: 300,
    machineId: "create:deployer",
    notes: "Placeholder for the full sequenced assembly chain."
  }
];

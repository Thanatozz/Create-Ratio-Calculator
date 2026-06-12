export interface CreateIconDefinition {
  label: string;
  tone: "stone" | "brass" | "copper" | "zinc" | "iron" | "machine" | "fan";
}

// Keep the placeholder badge system available, but disabled by default.
// Turn this on only when placeholder badges or approved real icon assets should render.
export const createIconPlaceholdersEnabled = false;

export const itemIconMap: Record<string, CreateIconDefinition> = {
  "minecraft:cobblestone": { label: "Co", tone: "stone" },
  "minecraft:gravel": { label: "Gr", tone: "stone" },
  "minecraft:sand": { label: "Sa", tone: "brass" },
  "minecraft:flint": { label: "Fl", tone: "stone" },
  "minecraft:clay_ball": { label: "Cl", tone: "stone" },
  "minecraft:soul_sand": { label: "Ss", tone: "stone" },
  "minecraft:wheat": { label: "Wh", tone: "brass" },
  "create:wheat_flour": { label: "Wf", tone: "brass" },
  "minecraft:andesite": { label: "An", tone: "stone" },
  "create:andesite_alloy": { label: "Aa", tone: "zinc" },
  "minecraft:copper_ingot": { label: "Cu", tone: "copper" },
  "create:zinc_ingot": { label: "Zn", tone: "zinc" },
  "create:brass_ingot": { label: "Br", tone: "brass" },
  "minecraft:iron_nugget": { label: "In", tone: "iron" },
  "minecraft:iron_ingot": { label: "Fe", tone: "iron" },
  "create:iron_sheet": { label: "Is", tone: "iron" },
  "minecraft:gold_ingot": { label: "Au", tone: "brass" },
  "create:golden_sheet": { label: "Gs", tone: "brass" },
  "minecraft:oak_log": { label: "Lo", tone: "stone" },
  "minecraft:oak_planks": { label: "Pl", tone: "stone" },
  "create:cogwheel": { label: "Cg", tone: "brass" },
  "create:large_cogwheel": { label: "LC", tone: "brass" },
  "create:shaft": { label: "Sh", tone: "zinc" },
  "create:precision_mechanism": { label: "Pm", tone: "brass" },
  "create:andesite_casing": { label: "Ac", tone: "zinc" },
  "create:brass_casing": { label: "Bc", tone: "brass" },
  "create:electron_tube": { label: "Et", tone: "copper" },
  "minecraft:redstone": { label: "Rs", tone: "copper" }
};

export const machineIconMap: Record<string, CreateIconDefinition> = {
  "create:mechanical_drill": { label: "Dr", tone: "machine" },
  "create:crushing_wheel_pair": { label: "Cr", tone: "machine" },
  "create:millstone": { label: "Mi", tone: "stone" },
  "create:mechanical_mixer": { label: "Mx", tone: "brass" },
  "create:mechanical_press": { label: "Pr", tone: "iron" },
  "create:encased_fan_washing": { label: "Wa", tone: "fan" },
  "create:encased_fan_haunting": { label: "Ha", tone: "fan" },
  "create:mechanical_saw": { label: "Sw", tone: "machine" },
  "create:deployer": { label: "Dp", tone: "machine" },
  "create:basin": { label: "Ba", tone: "brass" }
};

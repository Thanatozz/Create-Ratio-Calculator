import type { MachineDefinition } from "../../calculator-core/types";

export const machines: MachineDefinition[] = [
  {
    id: "create:mechanical_drill",
    name: "Mechanical Drill",
    type: "physical_generator_consumer",
    stressImpactPerRpm: 4,
    defaultRpm: 256,
    defaultEfficiency: 0.85,
    notes: "Used here for the cobblestone generator special case."
  },
  {
    id: "create:crushing_wheel_pair",
    name: "Crushing Wheel Pair",
    type: "stack_processing",
    stressImpactPerRpm: 8,
    blocksPerSet: 2,
    defaultRpm: 256,
    defaultEfficiency: 1,
    realisticEfficiency: 1,
    notes: "One logical set contains two crushing wheel blocks."
  },
  {
    id: "create:millstone",
    name: "Millstone",
    type: "single_item_processing",
    stressImpactPerRpm: 4,
    defaultRpm: 256,
    defaultEfficiency: 0.85
  },
  {
    id: "create:mechanical_press",
    name: "Mechanical Press",
    type: "single_item_processing",
    stressImpactPerRpm: 8,
    defaultRpm: 256,
    defaultEfficiency: 0.85
  },
  {
    id: "create:mechanical_mixer",
    name: "Mechanical Mixer",
    type: "basin_processing",
    stressImpactPerRpm: 4,
    defaultRpm: 256,
    defaultEfficiency: 0.85
  },
  {
    id: "create:encased_fan_washing",
    name: "Encased Fan Washing",
    type: "fan_processing",
    stressImpactPerRpm: 2,
    defaultRpm: 256,
    defaultEfficiency: 0.85
  },
  {
    id: "create:encased_fan_haunting",
    name: "Encased Fan Haunting",
    type: "fan_processing",
    stressImpactPerRpm: 2,
    defaultRpm: 256,
    defaultEfficiency: 0.85
  },
  {
    id: "create:mechanical_saw",
    name: "Mechanical Saw",
    type: "cutting",
    stressImpactPerRpm: 4,
    defaultRpm: 256,
    defaultEfficiency: 0.85
  },
  {
    id: "create:deployer",
    name: "Deployer",
    type: "deploying",
    stressImpactPerRpm: 4,
    defaultRpm: 256,
    defaultEfficiency: 0.85
  },
  {
    id: "create:basin",
    name: "Basin",
    type: "basin_processing",
    stressImpactPerRpm: 0,
    defaultRpm: 256,
    defaultEfficiency: 1,
    notes: "Passive basin container; powered basin recipes are attributed to mixer or press."
  }
];

export const machineById = machines.reduce<Record<string, MachineDefinition>>(
  (acc, machine) => {
    acc[machine.id] = machine;
    return acc;
  },
  {}
);

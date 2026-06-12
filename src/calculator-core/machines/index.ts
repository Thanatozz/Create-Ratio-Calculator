import type { MachineCalculator } from "../types";
import { basinCalculator } from "./basin";
import { crushingWheelCalculator } from "./crushingWheel";
import { deployerCalculator } from "./deployer";
import {
  encasedFanHauntingCalculator,
  encasedFanWashingCalculator
} from "./encasedFan";
import { createGenericMachineCalculator } from "./generic";
import { mechanicalDrillCalculator } from "./mechanicalDrill";
import { mechanicalMixerCalculator } from "./mechanicalMixer";
import { mechanicalPressCalculator } from "./mechanicalPress";
import { mechanicalSawCalculator } from "./mechanicalSaw";
import { millstoneCalculator } from "./millstone";

const calculators = new Map<string, MachineCalculator>([
  [mechanicalDrillCalculator.machineId, mechanicalDrillCalculator],
  [crushingWheelCalculator.machineId, crushingWheelCalculator],
  [millstoneCalculator.machineId, millstoneCalculator],
  [mechanicalPressCalculator.machineId, mechanicalPressCalculator],
  [mechanicalMixerCalculator.machineId, mechanicalMixerCalculator],
  [encasedFanWashingCalculator.machineId, encasedFanWashingCalculator],
  [encasedFanHauntingCalculator.machineId, encasedFanHauntingCalculator],
  [mechanicalSawCalculator.machineId, mechanicalSawCalculator],
  [deployerCalculator.machineId, deployerCalculator],
  [basinCalculator.machineId, basinCalculator]
]);

export function getMachineCalculator(machineId: string): MachineCalculator {
  return calculators.get(machineId) ?? createGenericMachineCalculator(machineId);
}

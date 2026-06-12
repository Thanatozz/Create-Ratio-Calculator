import type {
  GeneratorPlan,
  MixedGeneratorPlan,
  SuGeneratorDefinition,
  SuSummary
} from "../types";
import {
  ACTIVE_STEAM_ENGINE_ID,
  CREATIVE_GENERATOR_ID,
  MAX_HEATED_STEAM_ENGINE_ID,
  SMALL_ACTIVE_STEAM_ENGINE_ID,
  SUPERHEATED_BOILER_ID
} from "../../data/create-1.21.1/suGenerators";
import { buildGeneratorPlan, calculateGeneratorCount } from "./generators";

function findPlan(
  plans: GeneratorPlan[],
  predicate: (plan: GeneratorPlan) => boolean
): GeneratorPlan | undefined {
  return plans.find(predicate);
}

function buildActivePlusLargeWheelPlan(
  recommendedSu: number,
  generators: SuGeneratorDefinition[]
): MixedGeneratorPlan | undefined {
  const active = generators.find(
    (generator) => generator.id === SMALL_ACTIVE_STEAM_ENGINE_ID
  );
  const largeWheel = generators.find(
    (generator) => generator.id === "create:large_water_wheel"
  );

  if (!active || !largeWheel || recommendedSu <= active.suCapacity) {
    return undefined;
  }

  const activePlan = buildGeneratorPlan(active, active.suCapacity);
  activePlan.count = 1;
  activePlan.totalSu = active.suCapacity;
  activePlan.surplusSu = 0;

  const remainingSu = recommendedSu - active.suCapacity;
  const wheelCount = calculateGeneratorCount(remainingSu, largeWheel.suCapacity);
  const wheelTotal = wheelCount * largeWheel.suCapacity;
  const wheelPlan: GeneratorPlan = {
    ...buildGeneratorPlan(largeWheel, remainingSu),
    count: wheelCount,
    totalSu: wheelTotal,
    surplusSu: wheelTotal - remainingSu
  };

  const totalSu = activePlan.totalSu + wheelPlan.totalSu;

  return {
    id: "mixed:small_active_plus_large_water_wheels",
    name: "1 Small Active Steam Engine + Large Water Wheels",
    parts: [activePlan, wheelPlan],
    totalSu,
    surplusSu: totalSu - recommendedSu
  };
}

function findPlanById(
  plans: GeneratorPlan[],
  generatorId: string
): GeneratorPlan | undefined {
  return findPlan(plans, (plan) => plan.generatorId === generatorId);
}

function recommendedPlanForDemand(
  plans: GeneratorPlan[],
  recommendedSu: number
): GeneratorPlan | undefined {
  const nonCreativePlans = plans.filter((plan) => plan.category !== "creative");
  const hasCreativeOnly = nonCreativePlans.length === 0;
  const availablePlans = hasCreativeOnly ? plans : nonCreativePlans;

  if (recommendedSu <= 1024) {
    return findPlanById(availablePlans, "create:water_wheel");
  }

  if (recommendedSu <= 4096) {
    return findPlanById(availablePlans, "create:large_water_wheel");
  }

  if (recommendedSu <= 12000) {
    return findPlanById(availablePlans, "create:windmill_bearing");
  }

  if (recommendedSu <= 32768) {
    return findPlanById(availablePlans, SMALL_ACTIVE_STEAM_ENGINE_ID);
  }

  if (recommendedSu <= 65536) {
    return findPlanById(availablePlans, ACTIVE_STEAM_ENGINE_ID);
  }

  if (recommendedSu <= 147456) {
    return findPlanById(availablePlans, MAX_HEATED_STEAM_ENGINE_ID);
  }

  if (recommendedSu <= 294912) {
    return findPlanById(availablePlans, SUPERHEATED_BOILER_ID);
  }

  return (
    findPlanById(availablePlans, SUPERHEATED_BOILER_ID) ??
    findPlanById(availablePlans, MAX_HEATED_STEAM_ENGINE_ID) ??
    findPlanById(availablePlans, ACTIVE_STEAM_ENGINE_ID) ??
    findPlanById(availablePlans, SMALL_ACTIVE_STEAM_ENGINE_ID) ??
    findPlanById(availablePlans, CREATIVE_GENERATOR_ID) ??
    availablePlans[0]
  );
}

export function buildSuSummary(params: {
  consumedSu: number;
  margin: number;
  generators: SuGeneratorDefinition[];
}): SuSummary {
  const recommendedSu = Math.ceil(params.consumedSu * (1 + params.margin));
  const generatorPlans = params.generators.map((generator) =>
    buildGeneratorPlan(generator, recommendedSu)
  );
  const nonCreativePlans = generatorPlans.filter(
    (plan) => plan.category !== "creative"
  );
  const minimumSetup = [...nonCreativePlans].sort(
    (a, b) => a.surplusSu - b.surplusSu || a.count - b.count
  )[0];
  const recommendedSetup =
    recommendedPlanForDemand(generatorPlans, recommendedSu) ?? minimumSetup;
  const earlyGameSetup =
    findPlan(generatorPlans, (plan) => plan.generatorId === "create:large_water_wheel") ??
    findPlan(generatorPlans, (plan) => plan.category === "early_game");
  const lateGameSetup =
    findPlan(generatorPlans, (plan) => plan.generatorId === SUPERHEATED_BOILER_ID) ??
    findPlan(generatorPlans, (plan) => plan.generatorId === MAX_HEATED_STEAM_ENGINE_ID) ??
    findPlan(generatorPlans, (plan) => plan.generatorId === ACTIVE_STEAM_ENGINE_ID) ??
    findPlan(generatorPlans, (plan) => plan.category === "late_game");
  const activePlusLargeWheel = buildActivePlusLargeWheelPlan(
    recommendedSu,
    params.generators
  );

  return {
    consumedSu: params.consumedSu,
    recommendedSu,
    margin: params.margin,
    generatorPlans,
    mixedPlans: activePlusLargeWheel ? [activePlusLargeWheel] : [],
    minimumSetup,
    recommendedSetup,
    earlyGameSetup,
    lateGameSetup,
    surplusOrDeficit: (minimumSetup?.totalSu ?? 0) - recommendedSu,
    overstressed: params.consumedSu > (minimumSetup?.totalSu ?? 0)
  };
}

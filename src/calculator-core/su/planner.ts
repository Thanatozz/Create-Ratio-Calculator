import type {
  GeneratorPlan,
  MixedGeneratorPlan,
  SuGeneratorDefinition,
  SuSummary
} from "../types";
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
    (generator) => generator.id === "create:steam_engine_active"
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
    id: "mixed:active_plus_large_water_wheels",
    name: "1 Active Steam Engine + Large Water Wheels",
    parts: [activePlan, wheelPlan],
    totalSu,
    surplusSu: totalSu - recommendedSu
  };
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
    findPlan(generatorPlans, (plan) => plan.generatorId === "create:steam_engine_passive") ??
    minimumSetup;
  const earlyGameSetup =
    findPlan(generatorPlans, (plan) => plan.generatorId === "create:large_water_wheel") ??
    findPlan(generatorPlans, (plan) => plan.category === "early_game");
  const lateGameSetup =
    findPlan(generatorPlans, (plan) => plan.generatorId === "create:steam_engine_active") ??
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

import { BatteryCharging, Gauge, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { calculateGeneratorCount } from "../../calculator-core/su/generators";
import type { GeneratorPlan } from "../../calculator-core/types";
import { NumberField } from "../../components/controls/NumberField";
import { SelectField } from "../../components/controls/SelectField";
import { formatNumber, formatSu } from "../../components/ui/format";
import {
  ACTIVE_STEAM_ENGINE_ID,
  CREATIVE_GENERATOR_ID,
  MAX_HEATED_STEAM_ENGINE_ID,
  SMALL_ACTIVE_STEAM_ENGINE_ID,
  SUPERHEATED_BOILER_ID,
  getVisibleSuGenerators
} from "../../data/create-1.21.1/suGenerators";
import { useTranslation } from "../../i18n";
import { useCalculatorStore } from "../../stores/calculatorStore";
import { useSettingsStore } from "../../stores/settingsStore";

interface GeneratorOption {
  plan: GeneratorPlan;
  minimumCount: number;
  recommendedCount: number;
  recommendedTotalSu: number;
  level: string;
  notes: string;
}

interface SuggestedPlan {
  title: string;
  generatorName: string;
  count: number;
  totalSu: number;
  surplusSu: number;
  notes: string;
}

function categoryLabel(
  category: GeneratorPlan["category"],
  t: ReturnType<typeof useTranslation>
): string {
  switch (category) {
    case "early_game":
      return t("su.earlyGame");
    case "mid_game":
      return t("su.midGame");
    case "late_game":
      return t("su.lateGame");
    case "creative":
      return t("su.creative");
  }
}

function buildOptions(
  su: ReturnType<typeof useCalculatorStore.getState>["result"]["su"],
  visibleGenerators: ReturnType<typeof getVisibleSuGenerators>
): GeneratorOption[] {
  return su.generatorPlans.map((plan) => {
    const definition = visibleGenerators.find(
      (generator) => generator.id === plan.generatorId
    );
    const minimumCount = calculateGeneratorCount(su.consumedSu, plan.suCapacityEach);
    const recommendedCount = calculateGeneratorCount(
      su.recommendedSu,
      plan.suCapacityEach
    );

    return {
      plan,
      minimumCount,
      recommendedCount,
      recommendedTotalSu: recommendedCount * plan.suCapacityEach,
      level: definition?.level ?? "-",
      notes: definition?.notes ?? (definition?.configurable ? "Configurable" : "")
    };
  });
}

function recommendedGeneratorIdForDemand(
  recommendedSu: number,
  showCreativeGenerator: boolean
): string {
  if (recommendedSu <= 1024) return "create:water_wheel";
  if (recommendedSu <= 4096) return "create:large_water_wheel";
  if (recommendedSu <= 12000) return "create:windmill_bearing";
  if (recommendedSu <= 32768) return SMALL_ACTIVE_STEAM_ENGINE_ID;
  if (recommendedSu <= 65536) return ACTIVE_STEAM_ENGINE_ID;
  if (recommendedSu <= 147456) return MAX_HEATED_STEAM_ENGINE_ID;
  if (recommendedSu <= 294912) return SUPERHEATED_BOILER_ID;
  if (showCreativeGenerator && recommendedSu > 1000000000) {
    return CREATIVE_GENERATOR_ID;
  }
  return SUPERHEATED_BOILER_ID;
}

function planFromOption(
  title: string,
  option: GeneratorOption | undefined,
  recommendedSu: number,
  notes: string
): SuggestedPlan | undefined {
  if (!option) return undefined;

  return {
    title,
    generatorName: option.plan.generatorName,
    count: option.recommendedCount,
    totalSu: option.recommendedTotalSu,
    surplusSu: option.recommendedTotalSu - recommendedSu,
    notes
  };
}

function buildSuggestedPlans(
  options: GeneratorOption[],
  recommendedSu: number
): SuggestedPlan[] {
  const early = options.find(
    (option) => option.plan.generatorId === "create:large_water_wheel"
  );
  const compact = [...options]
    .filter((option) => option.plan.category !== "creative")
    .sort(
      (a, b) =>
        a.recommendedCount - b.recommendedCount ||
        b.plan.suCapacityEach - a.plan.suCapacityEach
    )[0];
  const late =
    options.find((option) => option.plan.generatorId === SUPERHEATED_BOILER_ID) ??
    options.find((option) => option.plan.generatorId === MAX_HEATED_STEAM_ENGINE_ID) ??
    options.find((option) => option.plan.generatorId === ACTIVE_STEAM_ENGINE_ID);
  const creative = options.find(
    (option) => option.plan.generatorId === CREATIVE_GENERATOR_ID
  );

  return [
    planFromOption("Early game plan", early, recommendedSu, "Large Water Wheel setup."),
    planFromOption("Compact plan", compact, recommendedSu, "Fewest non-creative generators."),
    planFromOption("Late game plan", late, recommendedSu, "High-capacity steam setup."),
    planFromOption("Overkill plan", creative ?? late, recommendedSu, "Extra headroom.")
  ].filter((plan): plan is SuggestedPlan => Boolean(plan));
}

function CompactMetric({
  label,
  value,
  detail,
  tone = "text-stone-100"
}: {
  label: string;
  value: string;
  detail?: string;
  tone?: string;
}) {
  return (
    <div className="create-result-bar px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-stone-500">{label}</div>
      <div className={`text-base font-semibold ${tone}`}>{value}</div>
      {detail ? <div className="text-xs text-stone-500">{detail}</div> : null}
    </div>
  );
}

export function SuPlannerTab() {
  const su = useCalculatorStore((state) => state.result.su);
  const preferredSuGeneratorId = useSettingsStore(
    (settings) => settings.preferredSuGeneratorId
  );
  const showCreativeGenerator = useSettingsStore(
    (settings) => settings.showCreativeGenerator
  );
  const t = useTranslation();
  const visibleGenerators = getVisibleSuGenerators(showCreativeGenerator);
  const options = buildOptions(su, visibleGenerators);
  const [targetSu, setTargetSu] = useState(su.recommendedSu);
  const [calculatorGeneratorId, setCalculatorGeneratorId] = useState(
    preferredSuGeneratorId
  );
  const selectedCalculatorGenerator =
    visibleGenerators.find((generator) => generator.id === calculatorGeneratorId) ??
    visibleGenerators[0];
  const preferredOption = options.find(
    (option) => option.plan.generatorId === preferredSuGeneratorId
  );
  const recommendedOption = options.find(
    (option) =>
      option.plan.generatorId ===
      recommendedGeneratorIdForDemand(su.recommendedSu, showCreativeGenerator)
  );
  const configuredGeneratedSu = preferredOption?.recommendedTotalSu ?? 0;
  const configuredSurplus = configuredGeneratedSu - su.recommendedSu;
  const calculatorMinimumCount = calculateGeneratorCount(
    targetSu,
    selectedCalculatorGenerator.suCapacity
  );
  const calculatorRecommendedCount = calculateGeneratorCount(
    targetSu * (1 + su.margin),
    selectedCalculatorGenerator.suCapacity
  );
  const calculatorGeneratedSu =
    calculatorRecommendedCount * selectedCalculatorGenerator.suCapacity;
  const calculatorSurplus = calculatorGeneratedSu - targetSu;
  const suggestedPlans = buildSuggestedPlans(options, su.recommendedSu);
  const normalOptions = options.filter(
    (option) => option.plan.category !== "creative"
  );
  const creativeOptions = options.filter(
    (option) => option.plan.category === "creative"
  );
  const recommendedLabel =
    recommendedOption?.plan.generatorId === SUPERHEATED_BOILER_ID &&
    recommendedOption.recommendedCount > 1
      ? t("su.multipleSuperheatedBoilers")
      : recommendedOption?.plan.generatorName;

  useEffect(() => {
    if (selectedCalculatorGenerator.id !== calculatorGeneratorId) {
      setCalculatorGeneratorId(selectedCalculatorGenerator.id);
    }
  }, [calculatorGeneratorId, selectedCalculatorGenerator.id]);

  return (
    <div className="create-page industrial-scrollbar h-full min-h-0 overflow-auto p-3">
      {/* [<section className="create-panel mx-auto mb-3 w-full max-w-6xl p-3">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-factory-brass">
          {t("su.factorySummary")}
        </div>
        <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">
          <CompactMetric
            label={t("su.totalConsumed")}
            value={formatSu(su.consumedSu)}
            tone="text-factory-su"
          />
          <CompactMetric
            label={t("su.recommendedWithMargin")}
            value={formatSu(su.recommendedSu)}
            detail={t("factory.margin", { value: Math.round(su.margin * 100) })}
            tone="text-factory-brass"
          />
          <CompactMetric
            label={t("su.configuredGenerator")}
            value={preferredOption ? preferredOption.plan.generatorName : t("common.none")}
            tone="text-factory-copper"
          />
          <CompactMetric
            label={t("su.configuredCount")}
            value={preferredOption ? `${preferredOption.recommendedCount}x` : t("common.none")}
            detail={
              preferredOption ? formatSu(preferredOption.recommendedTotalSu) : undefined
            }
            tone="text-factory-copper"
          />
          <CompactMetric
            label={t("su.recommendedGenerator")}
            value={recommendedOption ? `${recommendedOption.recommendedCount}x` : t("common.none")}
            detail={recommendedOption?.plan.generatorName}
            tone="text-factory-green"
          />
          <CompactMetric
            label={configuredSurplus >= 0 ? t("su.surplus") : t("su.deficit")}
            value={formatSu(Math.abs(configuredSurplus))}
            tone={configuredSurplus >= 0 ? "text-factory-green" : "text-factory-danger"}
          />
        </div>
      </section>] */}

      <section className="mx-auto mb-3 grid w-full max-w-6xl gap-2 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="create-panel p-3">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-factory-brass">
            {t("su.countCalculator")}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <NumberField
              label={t("su.targetAmount")}
              value={targetSu}
              min={0}
              step={256}
              onChange={setTargetSu}
            />
            <SelectField
              label={t("su.generatorType")}
              value={selectedCalculatorGenerator.id}
              options={visibleGenerators.map((generator) => ({
                value: generator.id,
                label: generator.name
              }))}
              onChange={setCalculatorGeneratorId}
            />
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-4">
            <CompactMetric
              label={t("su.minimumCount")}
              value={`${calculatorMinimumCount}x`}
              detail={selectedCalculatorGenerator.name}
            />
            <CompactMetric
              label={t("su.recommendedCount")}
              value={`${calculatorRecommendedCount}x`}
              detail={t("factory.margin", { value: Math.round(su.margin * 100) })}
              tone="text-factory-brass"
            />
            <CompactMetric
              label={t("su.totalGenerated")}
              value={formatSu(calculatorGeneratedSu)}
              tone="text-factory-su"
            />
            <CompactMetric
              label={calculatorSurplus >= 0 ? t("su.surplus") : t("su.deficit")}
              value={formatSu(Math.abs(calculatorSurplus))}
              tone={calculatorSurplus >= 0 ? "text-factory-green" : "text-factory-danger"}
            />
          </div>
        </div>
        {/* <div className="create-panel p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-factory-brass">
            {t("su.thresholdRecommendation")}
          </div>
          <div className="text-sm text-stone-300">
            <strong className="text-factory-brass">
              {recommendedOption
                ? `${recommendedOption.recommendedCount}x ${recommendedLabel}`
                : t("common.none")}
            </strong>
          </div>
          <div className="mt-1 text-xs text-stone-500">
            {t("su.moveUpNote")}
          </div>
        </div> */}
      </section>

      <section className="create-panel mx-auto w-full max-w-6xl">
        <div className="flex items-center gap-2 border-b border-factory-border px-3 py-2 text-xs font-semibold uppercase tracking-wide text-factory-brass">
          <Gauge size={14} />
          {t("su.generatorOptions")}
        </div>
        <div className="overflow-auto">
          <table className="create-technical-table w-full min-w-[860px] text-left text-sm">
            <thead className="text-[11px] uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-3 py-2">{t("su.generator")}</th>
                <th className="px-3 py-2">{t("su.level")}</th>
                <th className="px-3 py-2 text-right">{t("su.suEach")}</th>
                <th className="px-3 py-2 text-right">{t("su.minimumCount")}</th>
                <th className="px-3 py-2 text-right">{t("su.recommendedCount")}</th>
                <th className="px-3 py-2">{t("su.category")}</th>
                <th className="px-3 py-2">{t("resources.notes")}</th>
              </tr>
            </thead>
            <tbody>
              {normalOptions.map((option) => (
                <tr
                  key={option.plan.id}
                  className="border-t border-factory-border/80 hover:bg-factory-panel2/60"
                >
                  <td className="px-3 py-2 font-semibold text-stone-100">
                    {option.plan.generatorName}
                  </td>
                  <td className="px-3 py-2 text-stone-300">
                    {option.plan.category === "creative"
                      ? t("su.creativeTesting")
                      : option.level}
                  </td>
                  <td className="px-3 py-2 text-right text-factory-su">
                    {formatSu(option.plan.suCapacityEach)}
                  </td>
                  <td className="px-3 py-2 text-right text-stone-300">
                    {formatNumber(option.minimumCount, 0)}
                  </td>
                  <td className="px-3 py-2 text-right text-factory-brass">
                    {formatNumber(option.recommendedCount, 0)}
                  </td>
                  <td className="px-3 py-2 text-stone-300">
                    {categoryLabel(option.plan.category, t)}
                  </td>
                  <td className="px-3 py-2 text-stone-500">{option.notes || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {showCreativeGenerator && creativeOptions.length > 0 ? (
        <section className="create-panel mx-auto mt-3 w-full max-w-6xl">
          <div className="flex items-center gap-2 border-b border-factory-border px-3 py-2 text-xs font-semibold uppercase tracking-wide text-factory-warning">
            <BatteryCharging size={14} />
            {t("su.creativeTesting")}
          </div>
          <div className="overflow-auto">
            <table className="create-technical-table w-full min-w-[720px] text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-3 py-2">{t("su.generator")}</th>
                  <th className="px-3 py-2">{t("su.level")}</th>
                  <th className="px-3 py-2 text-right">{t("su.suEach")}</th>
                  <th className="px-3 py-2">{t("su.category")}</th>
                  <th className="px-3 py-2">{t("resources.notes")}</th>
                </tr>
              </thead>
              <tbody>
                {creativeOptions.map((option) => (
                  <tr
                    key={option.plan.id}
                    className="border-t border-factory-border/80 hover:bg-factory-panel2/60"
                  >
                    <td className="px-3 py-2 font-semibold text-stone-100">
                      {option.plan.generatorName}
                    </td>
                    <td className="px-3 py-2 text-factory-warning">
                      {t("su.creativeTesting")}
                    </td>
                    <td className="px-3 py-2 text-right text-factory-su">
                      {formatSu(option.plan.suCapacityEach)}
                    </td>
                    <td className="px-3 py-2 text-stone-300">
                      {categoryLabel(option.plan.category, t)}
                    </td>
                    <td className="px-3 py-2 text-stone-500">
                      {option.notes || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {/* <section className="mx-auto mt-3 grid w-full max-w-6xl gap-2 lg:grid-cols-4">
        {suggestedPlans.map((plan) => (
          <div
            key={plan.title}
            className="create-panel p-3"
          >
            <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-stone-500">
              {plan.title.includes("Overkill") ? (
                <BatteryCharging size={14} className="text-factory-warning" />
              ) : (
                <Zap size={14} className="text-factory-su" />
              )}
              {plan.title}
            </div>
            <div className="text-sm font-semibold text-stone-100">
              {plan.count} {plan.generatorName}
            </div>
            <div className="mt-1 text-sm text-factory-su">
              {formatSu(plan.totalSu)}
            </div>
            <div className="text-xs text-stone-500">
              {formatSu(plan.surplusSu)} {t("su.surplus")}. {plan.notes}
            </div>
          </div>
        ))}
      </section> */}
    </div>
  );
}

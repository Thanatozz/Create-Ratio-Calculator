import { Database, Palette, RotateCcw, SlidersHorizontal, Zap } from "lucide-react";
import type { ReactNode } from "react";
import type { CalculatorMode, RpmPreset, TransportMode } from "../../calculator-core/types";
import { NumberField } from "../../components/controls/NumberField";
import { SelectField } from "../../components/controls/SelectField";
import { machines } from "../../data/create-1.21.1/machines";
import { getVisibleSuGenerators } from "../../data/create-1.21.1/suGenerators";
import { transportModes } from "../../data/create-1.21.1/transport";
import { allRecipeSources, CREATE_BASE_SOURCE_ID } from "../../data/recipeSources";
import { useTranslation, type Language, type ThemeMode } from "../../i18n";
import { useCalculatorStore } from "../../stores/calculatorStore";
import { useSettingsStore } from "../../stores/settingsStore";
import { useUiStore, type UiDensity } from "../../stores/uiStore";

const rpmOptions: RpmPreset[] = [16, 32, 64, 128, 256];

function SettingsSection({
  title,
  icon,
  children,
  defaultOpen = true
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      className="create-panel"
      open={defaultOpen}
    >
      <summary className="flex cursor-pointer items-center gap-2 border-b border-factory-border px-4 py-3 text-sm font-semibold uppercase tracking-wide text-factory-brass">
        {icon}
        {title}
      </summary>
      <div className="p-4">{children}</div>
    </details>
  );
}

function formatSourceStats(
  source: (typeof allRecipeSources)[number],
  t: ReturnType<typeof useTranslation>
): string {
  const supported = source.supportedRecipeCount ?? source.recipeCount;
  const unsupported = source.unsupportedRecipeCount ?? 0;
  const base = t("settings.recipesSupported", {
    recipes: source.recipeCount,
    supported
  });

  return `${base}${unsupported > 0 ? `, ${t("settings.recipesUnsupported", { count: unsupported })}` : ""}`;
}

export function SettingsTab() {
  const settings = useSettingsStore();
  const uiDensity = useUiStore((state) => state.uiDensity);
  const setUiDensity = useUiStore((state) => state.setUiDensity);
  const setActiveTab = useUiStore((state) => state.setActiveTab);
  const recalculate = useCalculatorStore((state) => state.calculate);
  const t = useTranslation();
  const visibleSuGenerators = getVisibleSuGenerators(settings.showCreativeGenerator);

  function updateAndRecalculate(update: () => void) {
    update();
    recalculate();
  }

  return (
    <div className="create-page industrial-scrollbar h-full min-h-0 overflow-auto p-4 pb-24">
      <div className="mx-auto mb-4 flex w-full max-w-6xl items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-factory-brass">
            {t("settings.title")}
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            {t("settings.description")}
          </p>
        </div>
        <button
          className="flex h-10 items-center gap-2 rounded-md border border-factory-border bg-factory-panel2 px-3 text-sm text-stone-200 hover:border-factory-brass"
          type="button"
          onClick={() => updateAndRecalculate(settings.resetSettings)}
        >
          <RotateCcw size={16} />
          {t("common.reset")}
        </button>
      </div>

      <div className="mx-auto grid w-full max-w-6xl gap-4">
        <SettingsSection title={t("settings.general")} icon={<SlidersHorizontal size={16} />}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label className="grid gap-1.5 text-sm text-stone-300">
              <span className="text-xs uppercase tracking-wide text-stone-500">
                {t("settings.minecraftVersion")}
              </span>
              <input
                className="h-10 rounded-md border border-factory-border bg-factory-panel2 px-3 outline-none focus:border-factory-brass"
                value={settings.minecraftVersion}
                onChange={(event) => settings.setMinecraftVersion(event.target.value)}
              />
            </label>
            <label className="grid gap-1.5 text-sm text-stone-300">
              <span className="text-xs uppercase tracking-wide text-stone-500">
                {t("settings.createVersion")}
              </span>
              <input
                className="h-10 rounded-md border border-factory-border bg-factory-panel2 px-3 outline-none focus:border-factory-brass"
                value={settings.createVersion}
                onChange={(event) => settings.setCreateVersion(event.target.value)}
              />
            </label>
            <SelectField<UiDensity>
              label={t("settings.uiDensity")}
              value={uiDensity}
              options={[
                { value: "compact", label: t("density.compact") },
                { value: "comfortable", label: t("density.comfortable") }
              ]}
              onChange={setUiDensity}
            />
          </div>
        </SettingsSection>

        <SettingsSection title={t("settings.defaults")} icon={<SlidersHorizontal size={16} />}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <SelectField<RpmPreset>
              label={t("settings.defaultRpm")}
              value={settings.defaultRpm}
              options={rpmOptions.map((rpm) => ({ value: rpm, label: `${rpm} RPM` }))}
              onChange={(rpm) =>
                updateAndRecalculate(() => settings.setDefaultRpm(Number(rpm) as RpmPreset))
              }
            />
            <SelectField<CalculatorMode>
              label={t("settings.defaultMode")}
              value={settings.defaultMode}
              options={[
                { value: "realistic", label: t("mode.realistic") },
                { value: "approximate", label: t("mode.approximate") }
              ]}
              onChange={(mode) => updateAndRecalculate(() => settings.setDefaultMode(mode))}
            />
            <NumberField
              label={t("settings.defaultStackSize")}
              value={settings.defaultStackSize}
              min={1}
              max={64}
              step={1}
              onChange={(value) =>
                updateAndRecalculate(() => settings.setDefaultStackSize(value))
              }
            />
            <SelectField<TransportMode>
              label={t("settings.defaultTransport")}
              value={settings.defaultTransportMode}
              options={Object.values(transportModes).map((mode) => ({
                value: mode.id,
                label: mode.name
              }))}
              onChange={(mode) =>
                updateAndRecalculate(() => settings.setDefaultTransportMode(mode))
              }
            />
            <SelectField
              label={t("settings.preferredSuSource")}
              value={settings.preferredSuGeneratorId}
              options={visibleSuGenerators.map((generator) => ({
                value: generator.id,
                label: generator.level && generator.level !== "-"
                  ? `${generator.name} ${generator.level}`
                  : generator.name
              }))}
              onChange={settings.setPreferredSuGeneratorId}
            />
            <NumberField
              label={t("settings.defaultEfficiency")}
              value={settings.defaultEfficiency}
              min={0.1}
              max={1}
              step={0.01}
              onChange={(value) =>
                updateAndRecalculate(() => settings.setDefaultEfficiency(value))
              }
            />
            <NumberField
              label={t("settings.suMargin")}
              value={settings.suMargin}
              min={0}
              max={1}
              step={0.01}
              onChange={(value) => updateAndRecalculate(() => settings.setSuMargin(value))}
            />
          </div>
        </SettingsSection>

        <SettingsSection title={t("settings.appearanceLanguage")} icon={<Palette size={16} />}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <SelectField<ThemeMode>
              label={t("settings.theme")}
              value={settings.theme}
              options={[
                { value: "dark", label: t("theme.dark") },
                { value: "light", label: t("theme.light") },
                { value: "system", label: t("theme.system") }
              ]}
              onChange={settings.setTheme}
            />
            <SelectField<Language>
              label={t("settings.language")}
              value={settings.language}
              options={[
                { value: "en", label: t("language.en") },
                { value: "es", label: t("language.es") },
                { value: "pt", label: t("language.pt") }
              ]}
              onChange={settings.setLanguage}
            />
          </div>
        </SettingsSection>

        <SettingsSection title={t("settings.recipeSources")} icon={<Database size={16} />}>
          <div className="mb-3 flex flex-wrap gap-2">
            <button
              className="rounded-md border border-factory-border bg-factory-panel2 px-3 py-2 text-xs text-stone-200 hover:border-factory-brass"
              type="button"
              onClick={() => updateAndRecalculate(settings.enableAllRecipeSources)}
            >
              {t("settings.enableAll")}
            </button>
            <button
              className="rounded-md border border-factory-border bg-factory-panel2 px-3 py-2 text-xs text-stone-200 hover:border-factory-brass"
              type="button"
              onClick={() => updateAndRecalculate(settings.disableAllAddonRecipeSources)}
            >
              {t("settings.disableAllAddons")}
            </button>
            <button
              className="rounded-md border border-factory-border bg-factory-panel2 px-3 py-2 text-xs text-stone-200 hover:border-factory-brass"
              type="button"
              onClick={() => updateAndRecalculate(settings.resetRecipeSources)}
            >
              {t("settings.resetRecipeSources")}
            </button>
          </div>

          <div className="grid gap-2">
            {allRecipeSources.map((source) => {
              const locked = source.alwaysEnabled || source.id === CREATE_BASE_SOURCE_ID;
              const checked =
                locked || settings.enabledRecipeSourceIds.includes(source.id);

              return (
                <label
                  key={source.id}
                  className="grid gap-1 rounded-md border border-factory-border bg-factory-panel2 p-3 text-sm text-stone-300 md:grid-cols-[auto_1fr_auto]"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={locked}
                    onChange={(event) =>
                      updateAndRecalculate(() =>
                        settings.setRecipeSourceEnabled(
                          source.id,
                          event.target.checked
                        )
                      )
                    }
                  />
                  <span>
                    <span className="font-semibold text-stone-100">
                      {source.displayName}
                    </span>
                    {locked ? (
                      <span className="ml-2 text-xs text-factory-brass">{t("common.locked")}</span>
                    ) : null}
                    <span className="block text-xs text-stone-500">
                      {formatSourceStats(source, t)}
                      {source.version ? ` - ${source.version}` : ""}
                      {source.fileName ? ` - ${source.fileName}` : ""}
                    </span>
                  </span>
                  <span className="text-xs uppercase tracking-wide text-stone-500">
                    {source.loader ?? "unknown"}
                  </span>
                </label>
              );
            })}
          </div>
        </SettingsSection>

        <SettingsSection title={t("settings.machineConstants")} icon={<SlidersHorizontal size={16} />} defaultOpen={false}>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {machines.map((machine) => (
              <NumberField
                key={machine.id}
                label={`${machine.name} SU/RPM`}
                value={
                  settings.machineStressOverrides[machine.id] ??
                  machine.stressImpactPerRpm
                }
                min={0}
                step={1}
                onChange={(value) =>
                  updateAndRecalculate(() =>
                    settings.setMachineStressOverride(machine.id, value)
                  )
                }
              />
            ))}
          </div>
        </SettingsSection>

        <SettingsSection title={t("settings.transportConstants")} icon={<SlidersHorizontal size={16} />} defaultOpen={false}>
          <div className="overflow-auto">
            <table className="create-technical-table w-full min-w-[520px] text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-3 py-2">{t("factory.transport")}</th>
                  <th className="px-3 py-2 text-right">Ticks</th>
                  <th className="px-3 py-2">{t("resources.notes")}</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(transportModes).map((mode) => (
                  <tr key={mode.id} className="border-t border-factory-border/80">
                    <td className="px-3 py-2 font-semibold text-stone-100">{mode.name}</td>
                    <td className="px-3 py-2 text-right text-factory-brass">{mode.inputDelayTicks}</td>
                    <td className="px-3 py-2 text-stone-500">{mode.notes ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SettingsSection>

        <SettingsSection title={t("settings.suGeneratorSettings")} icon={<Zap size={16} />} defaultOpen={false}>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {visibleSuGenerators.map((generator) => (
              <NumberField
                key={generator.id}
                label={`${generator.name}${generator.level && generator.level !== "-" ? ` ${generator.level}` : ""} capacity`}
                value={
                  settings.generatorCapacityOverrides[generator.id] ??
                  generator.suCapacity
                }
                min={0}
                step={256}
                onChange={(value) =>
                  updateAndRecalculate(() =>
                    settings.setGeneratorCapacityOverride(generator.id, value)
                  )
                }
              />
            ))}
          </div>
        </SettingsSection>

        <SettingsSection title={t("settings.advanced")} defaultOpen={false}>
          <div className="grid gap-3 text-sm text-stone-300">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.showAdvancedCalculations}
                onChange={(event) =>
                  settings.setShowAdvancedCalculations(event.target.checked)
                }
              />
              {t("settings.showAdvanced")}
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.showCreativeGenerator}
                onChange={(event) =>
                  updateAndRecalculate(() =>
                    settings.setShowCreativeGenerator(event.target.checked)
                  )
                }
              />
              {t("settings.showCreativeGenerator")}
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.developerMode}
                onChange={(event) =>
                  settings.setDeveloperMode(event.target.checked)
                }
              />
              {t("settings.developerMode")}
            </label>
            {settings.developerMode ? (
              <>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.showUnsupportedRecipesInDebug}
                    onChange={(event) =>
                      settings.setShowUnsupportedRecipesInDebug(event.target.checked)
                    }
                  />
                  {t("settings.showUnsupported")}
                </label>
              <button
                type="button"
                className="w-fit rounded-md border border-factory-border bg-factory-panel2 px-3 py-2 text-xs text-stone-200 hover:border-factory-brass"
                onClick={() => setActiveTab("debug")}
              >
                {t("settings.openDeveloper")}
              </button>
              </>
            ) : null}
          </div>
        </SettingsSection>
      </div>
    </div>
  );
}

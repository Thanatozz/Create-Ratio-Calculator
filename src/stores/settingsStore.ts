import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEFAULT_MODE,
  DEFAULT_REALISTIC_EFFICIENCY,
  DEFAULT_RPM,
  DEFAULT_STACK_SIZE,
  DEFAULT_SU_MARGIN,
  DEFAULT_TRANSPORT_MODE,
  SUPPORTED_CREATE_VERSION,
  SUPPORTED_MINECRAFT_VERSION
} from "../calculator-core/constants";
import type { CalculatorMode, RpmPreset, TransportMode } from "../calculator-core/types";
import { CREATIVE_GENERATOR_ID } from "../data/create-1.21.1/suGenerators";
import {
  allRecipeSources,
  CREATE_BASE_SOURCE_ID,
  defaultEnabledRecipeSourceIds,
  normalizeEnabledRecipeSourceIds
} from "../data/recipeSources";
import type { Language, ThemeMode } from "../i18n";

export type RecipeSourcePreference =
  | "enabled_sources"
  | "create_base"
  | "addons"
  | "preferred_source";

export interface SettingsState {
  minecraftVersion: string;
  createVersion: string;
  defaultRpm: RpmPreset;
  defaultStackSize: number;
  defaultMode: CalculatorMode;
  defaultTransportMode: TransportMode;
  preferredSuGeneratorId: string;
  theme: ThemeMode;
  language: Language;
  defaultEfficiency: number;
  suMargin: number;
  showAdvancedCalculations: boolean;
  showCreativeGenerator: boolean;
  developerMode: boolean;
  showUnsupportedRecipesInDebug: boolean;
  recipeSourcePreference: RecipeSourcePreference;
  pinnedRecipeId?: string;
  enabledRecipeSourceIds: string[];
  machineStressOverrides: Record<string, number>;
  generatorCapacityOverrides: Record<string, number>;
  setMinecraftVersion: (value: string) => void;
  setCreateVersion: (value: string) => void;
  setDefaultRpm: (value: RpmPreset) => void;
  setDefaultStackSize: (value: number) => void;
  setDefaultMode: (value: CalculatorMode) => void;
  setDefaultTransportMode: (value: TransportMode) => void;
  setPreferredSuGeneratorId: (value: string) => void;
  setTheme: (value: ThemeMode) => void;
  setLanguage: (value: Language) => void;
  setDefaultEfficiency: (value: number) => void;
  setSuMargin: (value: number) => void;
  setShowAdvancedCalculations: (value: boolean) => void;
  setShowCreativeGenerator: (value: boolean) => void;
  setDeveloperMode: (value: boolean) => void;
  setShowUnsupportedRecipesInDebug: (value: boolean) => void;
  setRecipeSourcePreference: (value: RecipeSourcePreference) => void;
  setPinnedRecipeId: (value: string | undefined) => void;
  setRecipeSourceEnabled: (sourceId: string, enabled: boolean) => void;
  enableAllRecipeSources: () => void;
  disableAllAddonRecipeSources: () => void;
  resetRecipeSources: () => void;
  setMachineStressOverride: (machineId: string, value: number) => void;
  setGeneratorCapacityOverride: (generatorId: string, value: number) => void;
  resetSettings: () => void;
}

const initialSettings = {
  minecraftVersion: SUPPORTED_MINECRAFT_VERSION,
  createVersion: SUPPORTED_CREATE_VERSION,
  defaultRpm: DEFAULT_RPM,
  defaultStackSize: DEFAULT_STACK_SIZE,
  defaultMode: DEFAULT_MODE,
  defaultTransportMode: DEFAULT_TRANSPORT_MODE,
  preferredSuGeneratorId: "create:large_water_wheel",
  theme: "dark" as const,
  language: "en" as const,
  defaultEfficiency: DEFAULT_REALISTIC_EFFICIENCY,
  suMargin: DEFAULT_SU_MARGIN,
  showAdvancedCalculations: false,
  showCreativeGenerator: false,
  developerMode: false,
  showUnsupportedRecipesInDebug: false,
  recipeSourcePreference: "enabled_sources" as const,
  pinnedRecipeId: undefined,
  enabledRecipeSourceIds: defaultEnabledRecipeSourceIds(),
  machineStressOverrides: {},
  generatorCapacityOverrides: {}
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...initialSettings,
      setMinecraftVersion: (minecraftVersion) => set({ minecraftVersion }),
      setCreateVersion: (createVersion) => set({ createVersion }),
      setDefaultRpm: (defaultRpm) => set({ defaultRpm }),
      setDefaultStackSize: (defaultStackSize) => set({ defaultStackSize }),
      setDefaultMode: (defaultMode) => set({ defaultMode }),
      setDefaultTransportMode: (defaultTransportMode) =>
        set({ defaultTransportMode }),
      setPreferredSuGeneratorId: (preferredSuGeneratorId) =>
        set((state) => ({
          preferredSuGeneratorId:
            preferredSuGeneratorId === CREATIVE_GENERATOR_ID &&
            !state.showCreativeGenerator
              ? initialSettings.preferredSuGeneratorId
              : preferredSuGeneratorId
        })),
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setDefaultEfficiency: (defaultEfficiency) => set({ defaultEfficiency }),
      setSuMargin: (suMargin) => set({ suMargin }),
      setShowAdvancedCalculations: (showAdvancedCalculations) =>
        set({ showAdvancedCalculations }),
      setShowCreativeGenerator: (showCreativeGenerator) =>
        set((state) => ({
          showCreativeGenerator,
          preferredSuGeneratorId:
            !showCreativeGenerator &&
            state.preferredSuGeneratorId === CREATIVE_GENERATOR_ID
              ? initialSettings.preferredSuGeneratorId
              : state.preferredSuGeneratorId
        })),
      setDeveloperMode: (developerMode) => set({ developerMode }),
      setShowUnsupportedRecipesInDebug: (showUnsupportedRecipesInDebug) =>
        set({ showUnsupportedRecipesInDebug }),
      setRecipeSourcePreference: (recipeSourcePreference) =>
        set({ recipeSourcePreference }),
      setPinnedRecipeId: (pinnedRecipeId) => set({ pinnedRecipeId }),
      setRecipeSourceEnabled: (sourceId, enabled) =>
        set((state) => {
          if (sourceId === CREATE_BASE_SOURCE_ID) {
            return {
              enabledRecipeSourceIds: normalizeEnabledRecipeSourceIds(
                state.enabledRecipeSourceIds
              )
            };
          }

          const sourceIds = new Set(state.enabledRecipeSourceIds);
          if (enabled) {
            sourceIds.add(sourceId);
          } else {
            sourceIds.delete(sourceId);
          }

          return {
            enabledRecipeSourceIds: normalizeEnabledRecipeSourceIds([...sourceIds])
          };
        }),
      enableAllRecipeSources: () =>
        set({
          enabledRecipeSourceIds: normalizeEnabledRecipeSourceIds(
            allRecipeSources.map((source) => source.id)
          )
        }),
      disableAllAddonRecipeSources: () =>
        set({ enabledRecipeSourceIds: [CREATE_BASE_SOURCE_ID] }),
      resetRecipeSources: () =>
        set({ enabledRecipeSourceIds: defaultEnabledRecipeSourceIds() }),
      setMachineStressOverride: (machineId, value) =>
        set((state) => ({
          machineStressOverrides: {
            ...state.machineStressOverrides,
            [machineId]: value
          }
        })),
      setGeneratorCapacityOverride: (generatorId, value) =>
        set((state) => ({
          generatorCapacityOverrides: {
            ...state.generatorCapacityOverrides,
            [generatorId]: value
          }
        })),
      resetSettings: () => set(initialSettings)
    }),
    {
      name: "create-ratio-calculator-settings",
      merge: (persisted, current) => {
        const merged = {
          ...current,
          ...(persisted as Partial<SettingsState>)
        };

        return {
          ...merged,
          preferredSuGeneratorId:
            !merged.showCreativeGenerator &&
            merged.preferredSuGeneratorId === CREATIVE_GENERATOR_ID
              ? initialSettings.preferredSuGeneratorId
              : merged.preferredSuGeneratorId,
          enabledRecipeSourceIds: normalizeEnabledRecipeSourceIds(
            merged.enabledRecipeSourceIds ?? []
          )
        };
      },
      partialize: (state) => ({
        minecraftVersion: state.minecraftVersion,
        createVersion: state.createVersion,
        defaultRpm: state.defaultRpm,
        defaultStackSize: state.defaultStackSize,
        defaultMode: state.defaultMode,
        defaultTransportMode: state.defaultTransportMode,
        preferredSuGeneratorId: state.preferredSuGeneratorId,
        theme: state.theme,
        language: state.language,
        defaultEfficiency: state.defaultEfficiency,
        suMargin: state.suMargin,
        showAdvancedCalculations: state.showAdvancedCalculations,
        showCreativeGenerator: state.showCreativeGenerator,
        developerMode: state.developerMode,
        showUnsupportedRecipesInDebug: state.showUnsupportedRecipesInDebug,
        recipeSourcePreference: state.recipeSourcePreference,
        pinnedRecipeId: state.pinnedRecipeId,
        enabledRecipeSourceIds: normalizeEnabledRecipeSourceIds(
          state.enabledRecipeSourceIds
        ),
        machineStressOverrides: state.machineStressOverrides,
        generatorCapacityOverrides: state.generatorCapacityOverrides
      })
    }
  )
);

import { create } from "zustand";
import type { AppTab } from "../app/routes";

export type UiDensity = "comfortable" | "compact";

interface UiState {
  activeTab: AppTab;
  graphDirection: "RIGHT" | "DOWN";
  showByproducts: boolean;
  showSuNodes: boolean;
  showApproximateLabels: boolean;
  uiDensity: UiDensity;
  autoLayoutVersion: number;
  fitViewVersion: number;
  setActiveTab: (tab: AppTab) => void;
  setGraphDirection: (direction: "RIGHT" | "DOWN") => void;
  setShowByproducts: (value: boolean) => void;
  setShowSuNodes: (value: boolean) => void;
  setShowApproximateLabels: (value: boolean) => void;
  setUiDensity: (value: UiDensity) => void;
  requestAutoLayout: () => void;
  requestFitView: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeTab: "factory",
  graphDirection: "RIGHT",
  showByproducts: true,
  showSuNodes: true,
  showApproximateLabels: true,
  uiDensity: "compact",
  autoLayoutVersion: 0,
  fitViewVersion: 0,
  setActiveTab: (activeTab) => set({ activeTab }),
  setGraphDirection: (graphDirection) => set({ graphDirection }),
  setShowByproducts: (showByproducts) => set({ showByproducts }),
  setShowSuNodes: (showSuNodes) => set({ showSuNodes }),
  setShowApproximateLabels: (showApproximateLabels) =>
    set({ showApproximateLabels }),
  setUiDensity: (uiDensity) => set({ uiDensity }),
  requestAutoLayout: () =>
    set((state) => ({ autoLayoutVersion: state.autoLayoutVersion + 1 })),
  requestFitView: () =>
    set((state) => ({ fitViewVersion: state.fitViewVersion + 1 }))
}));

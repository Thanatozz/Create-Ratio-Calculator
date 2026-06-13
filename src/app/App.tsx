import { useEffect } from "react";
import { ControlSidebar } from "../components/layout/ControlSidebar";
import { TopNavigation } from "../components/layout/TopNavigation";
import { useCalculatorStore } from "../stores/calculatorStore";
import { useSettingsStore } from "../stores/settingsStore";
import { useUiStore } from "../stores/uiStore";
import type { AppTab } from "./routes";
import { DebugTab } from "./tabs/DebugTab";
import { FactoryTab } from "./tabs/FactoryTab";
// import { ResourcesTab } from "./tabs/ResourcesTab";
import { SettingsTab } from "./tabs/SettingsTab";
import { SuPlannerTab } from "./tabs/SuPlannerTab";
import { VisualizeTab } from "./tabs/VisualizeTab";

function ActiveTab() {
  const activeTab = useUiStore((state) => state.activeTab);

  switch (activeTab) {
    case "factory":
      return <FactoryTab />;
    case "visualize":
      return <VisualizeTab />;
    // case "resources":
    //   return <ResourcesTab />;
    case "su_planner":
      return <SuPlannerTab />;
    case "settings":
      return <SettingsTab />;
    case "debug":
      return <DebugTab />;
  }
}

const pageThemes: Record<AppTab, "andesite" | "brass" | "copper" | "train"> = {
  factory: "andesite",
  visualize: "brass",
  // resources: "brass",
  su_planner: "copper",
  settings: "train",
  debug: "andesite"
};

export function shouldShowBottomStats(activeTab: AppTab) {
  void activeTab;
  return false;
}

export function App() {
  const calculate = useCalculatorStore((state) => state.calculate);
  const activeTab = useUiStore((state) => state.activeTab);
  const theme = useSettingsStore((state) => state.theme);
  const showFactorySidebar = activeTab === "factory";
  const pageTheme = pageThemes[activeTab];

  useEffect(() => {
    calculate();
  }, [calculate]);

  useEffect(() => {
    const applyTheme = () => {
      const resolvedTheme =
        theme === "system"
          ? window.matchMedia("(prefers-color-scheme: light)").matches
            ? "light"
            : "dark"
          : theme;

      document.documentElement.dataset.theme = resolvedTheme;
    };

    applyTheme();

    if (theme !== "system") {
      return;
    }

    const media = window.matchMedia("(prefers-color-scheme: light)");
    media.addEventListener("change", applyTheme);
    return () => media.removeEventListener("change", applyTheme);
  }, [theme]);

  const mainContent = (
    <section className="h-full min-h-0">
      <ActiveTab />
    </section>
  );

  return (
    <div
      className="create-app-shell flex h-screen min-h-screen flex-col overflow-hidden text-stone-100"
      data-page-theme={pageTheme}
    >
      <TopNavigation />
      <main
        className={
          showFactorySidebar
            ? "grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[260px_minmax(0,1fr)]"
            : "grid min-h-0 flex-1 grid-cols-1"
        }
      >
        {showFactorySidebar ? <ControlSidebar /> : null}
        {mainContent}
      </main>
    </div>
  );
}

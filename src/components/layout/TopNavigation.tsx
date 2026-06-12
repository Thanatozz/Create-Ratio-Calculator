import { tabs } from "../../app/routes";
import { useTranslation } from "../../i18n";
import { useUiStore } from "../../stores/uiStore";

export function TopNavigation() {
  const activeTab = useUiStore((state) => state.activeTab);
  const setActiveTab = useUiStore((state) => state.setActiveTab);
  const t = useTranslation();

  return (
    <header className="flex min-h-16 items-center justify-between border-b border-factory-border bg-factory-bg/95 px-4 backdrop-blur">
      <div className="min-w-0">
        <div className="text-lg font-semibold text-stone-100">Create Ratio Calculator</div>
        <div className="text-xs text-stone-500">
          {t("app.subtitle")}
        </div>
      </div>
      <nav className="flex items-center gap-1 overflow-x-auto">
        {tabs.map(({ id, labelKey, Icon }) => {
          const isActive = activeTab === id;
          const label = t(labelKey);
          return (
            <button
              key={id}
              className={`flex h-10 items-center gap-2 rounded-md px-3 text-sm transition ${
                isActive
                  ? "bg-factory-brass text-black"
                  : "text-stone-300 hover:bg-factory-panel2 hover:text-stone-100"
              }`}
              type="button"
              onClick={() => setActiveTab(id)}
              title={label}
            >
              <Icon size={16} />
              <span className="hidden lg:inline">{label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
}

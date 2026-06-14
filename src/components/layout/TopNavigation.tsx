import { tabs } from "../../app/routes";
import { useTranslation } from "../../i18n";
import { useUiStore } from "../../stores/uiStore";

export function TopNavigation() {
  const activeTab = useUiStore((state) => state.activeTab);
  const setActiveTab = useUiStore((state) => state.setActiveTab);
  const t = useTranslation();

  return (
    <header className="create-topnav flex min-h-14 flex-wrap items-center justify-between gap-2 px-3 py-2 sm:min-h-16 sm:flex-nowrap sm:px-4">
      <div className="min-w-0 shrink">
        <div className="create-brand-title truncate text-sm font-semibold text-stone-100 sm:text-lg">
          {t("app.title")}
        </div>
        <div className="hidden truncate text-xs text-stone-500 sm:block">
          {t("app.subtitle")}
        </div>
      </div>
      <nav className="industrial-scrollbar -mx-1 flex max-w-full items-center gap-1 overflow-x-auto px-1">
        {tabs.map(({ id, labelKey, Icon }) => {
          const isActive = activeTab === id;
          const label = t(labelKey);
          return (
            <button
              key={id}
              className={`create-nav-button flex h-11 min-w-11 shrink-0 items-center justify-center gap-2 px-2.5 text-sm transition sm:px-3 lg:justify-start ${
                isActive
                  ? "create-nav-button--active"
                  : "text-stone-300 hover:bg-factory-panel2 hover:text-stone-100"
              }`}
              type="button"
              onClick={() => setActiveTab(id)}
              title={label}
              aria-label={label}
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

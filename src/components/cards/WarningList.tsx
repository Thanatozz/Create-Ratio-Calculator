import { AlertTriangle, Info, OctagonAlert } from "lucide-react";
import type { CalculatorWarning } from "../../calculator-core/types";
import { useTranslation } from "../../i18n";

interface WarningListProps {
  warnings: CalculatorWarning[];
}

export function WarningList({ warnings }: WarningListProps) {
  const t = useTranslation();

  if (warnings.length === 0) {
    return (
      <div className="rounded-md border border-factory-border bg-factory-panel p-3 text-sm text-stone-400">
        {t("warnings.empty")}
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      {warnings.map((warning) => {
        const Icon =
          warning.severity === "error"
            ? OctagonAlert
            : warning.severity === "warning"
              ? AlertTriangle
              : Info;
        const color =
          warning.severity === "error"
            ? "text-factory-danger"
            : warning.severity === "warning"
              ? "text-factory-warning"
              : "text-factory-su";

        return (
          <div
            key={warning.id}
            className="rounded-md border border-factory-border bg-factory-panel p-3"
          >
            <div className={`flex items-center gap-2 text-sm font-semibold ${color}`}>
              <Icon size={16} />
              {warning.title}
            </div>
            <p className="mt-1 text-sm text-stone-400">{warning.message}</p>
          </div>
        );
      })}
    </div>
  );
}

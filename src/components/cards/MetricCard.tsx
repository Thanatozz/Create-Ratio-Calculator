import type { ReactNode } from "react";

interface MetricCardProps {
  label: string;
  value: string;
  detail?: string;
  tone?: "default" | "brass" | "copper" | "su" | "warning" | "danger" | "green";
  icon?: ReactNode;
}

const toneClasses: Record<NonNullable<MetricCardProps["tone"]>, string> = {
  default: "border-factory-border",
  brass: "border-factory-brass/50 text-factory-brass",
  copper: "border-factory-copper/50 text-factory-copper",
  su: "border-factory-su/50 text-factory-su",
  warning: "border-factory-warning/50 text-factory-warning",
  danger: "border-factory-danger/50 text-factory-danger",
  green: "border-factory-green/50 text-factory-green"
};

export function MetricCard({
  label,
  value,
  detail,
  tone = "default",
  icon
}: MetricCardProps) {
  return (
    <div className={`rounded-lg border bg-factory-panel p-4 ${toneClasses[tone]}`}>
      <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-stone-500">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-semibold text-stone-100">{value}</div>
      {detail ? <div className="mt-2 text-sm text-stone-400">{detail}</div> : null}
    </div>
  );
}

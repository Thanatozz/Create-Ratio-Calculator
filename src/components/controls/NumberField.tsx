import type { ReactNode } from "react";

interface NumberFieldProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  icon?: ReactNode;
}

export function NumberField({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  icon
}: NumberFieldProps) {
  return (
    <label className="grid gap-1.5 text-sm text-stone-300">
      <span className="flex items-center gap-2 text-xs uppercase tracking-wide text-stone-500">
        {icon}
        {label}
      </span>
      <input
        className="create-control h-10 px-3 text-sm text-stone-100 outline-none transition focus:border-factory-brass"
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

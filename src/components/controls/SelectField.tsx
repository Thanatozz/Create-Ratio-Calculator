import type { ReactNode } from "react";

interface SelectFieldProps<T extends string | number> {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
  icon?: ReactNode;
}

export function SelectField<T extends string | number>({
  label,
  value,
  options,
  onChange,
  icon
}: SelectFieldProps<T>) {
  return (
    <label className="grid gap-1.5 text-sm text-stone-300">
      <span className="flex items-center gap-2 text-xs uppercase tracking-wide text-stone-500">
        {icon}
        {label}
      </span>
      <select
        className="h-10 rounded-md border border-factory-border bg-factory-panel2 px-3 text-sm text-stone-100 outline-none transition focus:border-factory-brass"
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
      >
        {options.map((option) => (
          <option key={String(option.value)} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

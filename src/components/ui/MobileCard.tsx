import type { ReactNode } from "react";

/** Container that renders its children as a stacked card list, mobile-only. */
export function MobileCardList({
  children,
  className = ""
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`grid gap-2 md:hidden ${className}`}>{children}</div>;
}

/** A single themed card used inside MobileCardList. */
export function MobileCard({
  children,
  className = ""
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`create-result-bar grid gap-2 p-3 ${className}`}>{children}</div>
  );
}

/** A label/value row inside a MobileCard. */
export function CardField({
  label,
  value,
  valueClassName = "text-stone-200"
}: {
  label: string;
  value: ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="shrink-0 text-[11px] uppercase tracking-wide text-stone-500">
        {label}
      </span>
      <span className={`min-w-0 break-words text-right ${valueClassName}`}>{value}</span>
    </div>
  );
}

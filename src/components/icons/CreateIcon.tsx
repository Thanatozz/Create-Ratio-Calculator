import {
  createIconPlaceholdersEnabled,
  itemIconMap,
  machineIconMap,
  type CreateIconDefinition
} from "../../data/iconMaps";

const toneClass: Record<CreateIconDefinition["tone"], string> = {
  stone: "from-stone-500 to-stone-700 text-stone-100",
  brass: "from-yellow-600 to-yellow-800 text-stone-950",
  copper: "from-orange-500 to-orange-800 text-stone-950",
  zinc: "from-slate-300 to-slate-500 text-stone-950",
  iron: "from-zinc-300 to-zinc-600 text-stone-950",
  machine: "from-factory-copper to-factory-border text-stone-100",
  fan: "from-factory-su to-factory-border text-stone-100"
};

export function CreateIcon({
  id,
  kind = "item",
  size = "sm"
}: {
  id?: string;
  kind?: "item" | "machine";
  size?: "sm" | "md";
}) {
  if (!createIconPlaceholdersEnabled) {
    return null;
  }

  const definition =
    (id ? (kind === "machine" ? machineIconMap[id] : itemIconMap[id]) : undefined) ??
    { label: kind === "machine" ? "Ma" : "It", tone: "brass" as const };
  const dimension = size === "md" ? "h-8 w-8 text-[11px]" : "h-6 w-6 text-[9px]";

  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded border border-factory-border bg-gradient-to-br font-bold shadow-sm ${dimension} ${toneClass[definition.tone]}`}
    >
      {definition.label}
    </span>
  );
}

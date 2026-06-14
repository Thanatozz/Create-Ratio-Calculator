import {
  ArrowDownToLine,
  Blend,
  Box,
  Disc,
  Droplet,
  Droplets,
  Fan,
  Flame,
  Hammer,
  Hand,
  LayoutGrid,
  ListOrdered,
  Package,
  Scissors,
  type LucideIcon
} from "lucide-react";
import { canonicalProcess } from "../ui/displayName";

interface ProcessVisual {
  Icon: LucideIcon;
  tone: string;
}

/**
 * Process icon system for Create recipe types. Uses generic (MIT) lucide
 * glyphs, never Create assets. The fan family shares the same `Fan` base glyph
 * and is distinguished by colour. Colours read on both dark and light themes.
 */
const PROCESS_VISUALS: Record<string, ProcessVisual> = {
  crushing: { Icon: Hammer, tone: "text-stone-300" },
  pressing: { Icon: ArrowDownToLine, tone: "text-zinc-300" },
  milling: { Icon: Disc, tone: "text-factory-brass" },
  mixing: { Icon: Blend, tone: "text-factory-brass" },
  compacting: { Icon: Package, tone: "text-factory-copper" },
  deploying: { Icon: Hand, tone: "text-stone-300" },
  cutting: { Icon: Scissors, tone: "text-stone-300" },
  mechanical_crafting: { Icon: LayoutGrid, tone: "text-factory-brass" },
  crafting: { Icon: LayoutGrid, tone: "text-stone-300" },
  filling: { Icon: Droplets, tone: "text-factory-su" },
  emptying: { Icon: Droplet, tone: "text-factory-su" },
  smelting: { Icon: Flame, tone: "text-orange-400" },
  item_application: { Icon: Hand, tone: "text-stone-300" },
  sequenced_assembly: { Icon: ListOrdered, tone: "text-factory-brass" },
  // Fan family — same glyph, distinct tone.
  washing: { Icon: Fan, tone: "text-sky-400" },
  haunting: { Icon: Fan, tone: "text-violet-400" },
  smoking: { Icon: Fan, tone: "text-orange-400" },
  blasting: { Icon: Fan, tone: "text-red-400" },
  sanding: { Icon: Fan, tone: "text-amber-300" },
  freezing: { Icon: Fan, tone: "text-cyan-300" },
  fan_processing: { Icon: Fan, tone: "text-stone-400" },
  unknown: { Icon: Box, tone: "text-stone-500" }
};

interface ProcessIconProps {
  /** Raw recipe `type` (e.g. "create:crushing") or a canonical process key. */
  type?: string;
  size?: number;
  className?: string;
}

export function ProcessIcon({ type, size = 16, className = "" }: ProcessIconProps) {
  const canonical = canonicalProcess(type) ?? "unknown";
  const visual = PROCESS_VISUALS[canonical] ?? PROCESS_VISUALS.unknown;
  const { Icon, tone } = visual;
  return <Icon size={size} className={`${tone} ${className}`.trim()} aria-hidden />;
}

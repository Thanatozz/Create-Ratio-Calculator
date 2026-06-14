import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import type { ProductionGraphNodeData } from "../../calculator-core/types";
import { CreateIcon } from "../icons/CreateIcon";
import { useTranslation } from "../../i18n";

type MachineFlowNode = Node<ProductionGraphNodeData, "machine">;

function badgeKey(badge: unknown): string | undefined {
  if (typeof badge !== "string") {
    return undefined;
  }
  if (badge === "fixedMachine" || badge === "inputProvider") {
    return `badge.${badge}`;
  }
  return `status.${badge}`;
}

export function MachineNode({ data }: NodeProps<MachineFlowNode>) {
  const rate = data.metrics?.Available ?? data.metrics?.Required;
  const t = useTranslation();
  const machineId =
    typeof data.raw === "object" && data.raw !== null && "machineId" in data.raw
      ? String(data.raw.machineId)
      : undefined;
  const translatedBadge = badgeKey(data.badge);
  const vertical = data.direction === "DOWN";

  return (
    <div className="create-graph-node create-graph-node--machine min-w-44 max-w-[78vw] px-3 py-2.5 shadow-panel md:min-w-56 md:max-w-none">
      <Handle
        type="target"
        position={vertical ? Position.Top : Position.Left}
        className="!bg-factory-copper"
      />
      <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-stone-100">
        <CreateIcon id={machineId} kind="machine" />
        <span className="min-w-0 break-words">{data.label}</span>
      </div>
      <div className="mt-1 text-xs text-stone-500">{data.subtitle}</div>
      {rate ? <div className="mt-2 text-sm font-semibold text-factory-brass">{rate}</div> : null}
      {data.metrics?.SU ? (
        <div className="mt-1 text-xs text-factory-su">{data.metrics.SU} SU</div>
      ) : null}
      {data.badge ? (
        <div className="mt-2 text-[10px] uppercase tracking-wide text-factory-warning">
          {translatedBadge ? t(translatedBadge) : data.badge}
        </div>
      ) : null}
      <Handle
        type="source"
        position={vertical ? Position.Bottom : Position.Right}
        className="!bg-factory-copper"
      />
    </div>
  );
}

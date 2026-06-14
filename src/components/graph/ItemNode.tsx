import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import type { ProductionGraphNodeData } from "../../calculator-core/types";
import { useTranslation } from "../../i18n";
import { CreateIcon } from "../icons/CreateIcon";

type ItemFlowNode = Node<ProductionGraphNodeData, "item">;

export function ItemNode({ data }: NodeProps<ItemFlowNode>) {
  const t = useTranslation();
  const itemId =
    typeof data.raw === "object" && data.raw !== null && "itemId" in data.raw
      ? String(data.raw.itemId)
      : undefined;
  const badge =
    typeof data.badge === "string"
      ? t(`badge.${data.badge}`)
      : undefined;
  const vertical = data.direction === "DOWN";

  return (
    <div className="create-graph-node create-graph-node--item min-w-40 max-w-[78vw] px-3 py-2.5 shadow-panel md:min-w-48 md:max-w-none">
      <Handle
        type="target"
        position={vertical ? Position.Top : Position.Left}
        className="!bg-factory-brass"
      />
      <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-stone-100">
        <CreateIcon id={itemId} />
        <span className="min-w-0 break-words">{data.label}</span>
      </div>
      <div className="mt-1 text-xs text-stone-500">{data.subtitle}</div>
      {data.metrics?.Rate ? (
        <div className="mt-2 text-sm font-semibold text-factory-green">{data.metrics.Rate}</div>
      ) : null}
      {data.badge ? (
        <div className="mt-2 inline-flex rounded-full border border-factory-warning/40 px-2 py-0.5 text-[11px] text-factory-warning">
          {badge}
        </div>
      ) : null}
      <Handle
        type="source"
        position={vertical ? Position.Bottom : Position.Right}
        className="!bg-factory-brass"
      />
    </div>
  );
}

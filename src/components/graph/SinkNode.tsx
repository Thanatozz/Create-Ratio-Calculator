import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { Flag } from "lucide-react";
import type { ProductionGraphNodeData } from "../../calculator-core/types";

type SinkFlowNode = Node<ProductionGraphNodeData, "sink">;

export function SinkNode({ data }: NodeProps<SinkFlowNode>) {
  const vertical = data.direction === "DOWN";
  return (
    <div className="min-w-44 max-w-[78vw] rounded-md border border-factory-brass/70 bg-factory-panel px-4 py-3 shadow-panel md:min-w-56 md:max-w-none">
      <Handle
        type="target"
        position={vertical ? Position.Top : Position.Left}
        className="!bg-factory-brass"
      />
      <div className="flex min-w-0 items-center gap-2 text-base font-semibold text-stone-100">
        <Flag size={17} className="shrink-0 text-factory-brass" />
        <span className="min-w-0 break-words">{data.label}</span>
      </div>
      <div className="mt-1 text-xs text-stone-500">{data.subtitle}</div>
      {data.metrics?.Rate ? (
        <div className="mt-2 text-sm font-semibold text-factory-brass">{data.metrics.Rate}</div>
      ) : null}
    </div>
  );
}

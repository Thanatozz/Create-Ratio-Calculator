import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { Flag } from "lucide-react";
import type { ProductionGraphNodeData } from "../../calculator-core/types";

type SinkFlowNode = Node<ProductionGraphNodeData, "sink">;

export function SinkNode({ data }: NodeProps<SinkFlowNode>) {
  return (
    <div className="min-w-56 rounded-md border border-factory-brass/70 bg-factory-panel px-4 py-3 shadow-panel">
      <Handle type="target" position={Position.Left} className="!bg-factory-brass" />
      <div className="flex items-center gap-2 text-base font-semibold text-stone-100">
        <Flag size={17} className="text-factory-brass" />
        {data.label}
      </div>
      <div className="mt-1 text-xs text-stone-500">{data.subtitle}</div>
      {data.metrics?.Rate ? (
        <div className="mt-2 text-sm font-semibold text-factory-brass">{data.metrics.Rate}</div>
      ) : null}
    </div>
  );
}

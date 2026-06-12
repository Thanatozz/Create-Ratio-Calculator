import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { Import } from "lucide-react";
import type { ProductionGraphNodeData } from "../../calculator-core/types";

type SourceFlowNode = Node<ProductionGraphNodeData, "source">;

export function SourceNode({ data }: NodeProps<SourceFlowNode>) {
  return (
    <div className="min-w-60 rounded-md border border-factory-green/40 bg-factory-panel px-4 py-3 shadow-panel">
      <div className="flex items-center gap-2 text-base font-semibold text-stone-100">
        <Import size={17} className="text-factory-green" />
        {data.label}
      </div>
      <div className="mt-1 text-xs text-stone-500">{data.subtitle}</div>
      {data.metrics?.Rate ? (
        <div className="mt-2 text-sm font-semibold text-factory-green">{data.metrics.Rate}</div>
      ) : null}
      <Handle type="source" position={Position.Right} className="!bg-factory-green" />
    </div>
  );
}

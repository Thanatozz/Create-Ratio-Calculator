import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { TriangleAlert } from "lucide-react";
import type { ProductionGraphNodeData } from "../../calculator-core/types";

type WarningFlowNode = Node<ProductionGraphNodeData, "warning">;

export function WarningNode({ data }: NodeProps<WarningFlowNode>) {
  return (
    <div className="max-w-64 rounded-md border border-factory-warning/60 bg-factory-panel px-3 py-2 shadow-panel">
      <Handle type="target" position={Position.Left} className="!bg-factory-warning" />
      <div className="flex items-center gap-2 text-sm font-semibold text-factory-warning">
        <TriangleAlert size={15} />
        {data.label}
      </div>
      <div className="mt-1 text-xs leading-relaxed text-stone-400">{data.subtitle}</div>
    </div>
  );
}

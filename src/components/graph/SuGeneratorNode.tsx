import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { Zap } from "lucide-react";
import type { ProductionGraphNodeData } from "../../calculator-core/types";

type SuFlowNode = Node<ProductionGraphNodeData, "su_generator">;

export function SuGeneratorNode({ data }: NodeProps<SuFlowNode>) {
  return (
    <div className="min-w-60 rounded-md border border-factory-su/50 bg-factory-panel px-4 py-3 shadow-panel">
      <div className="flex items-center gap-2 text-base font-semibold text-stone-100">
        <Zap size={17} className="text-factory-su" />
        {data.label}
      </div>
      <div className="mt-1 text-xs text-stone-500">{data.subtitle}</div>
      <div className="mt-2 text-sm font-semibold text-factory-su">
        {data.metrics?.Capacity}
      </div>
      <Handle type="source" position={Position.Right} className="!bg-factory-su" />
    </div>
  );
}

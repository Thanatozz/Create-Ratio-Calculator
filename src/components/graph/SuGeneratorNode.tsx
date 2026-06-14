import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { Zap } from "lucide-react";
import type { ProductionGraphNodeData } from "../../calculator-core/types";

type SuFlowNode = Node<ProductionGraphNodeData, "su_generator">;

export function SuGeneratorNode({ data }: NodeProps<SuFlowNode>) {
  const vertical = data.direction === "DOWN";
  return (
    <div className="min-w-44 max-w-[78vw] rounded-md border border-factory-su/50 bg-factory-panel px-4 py-3 shadow-panel md:min-w-60 md:max-w-none">
      <div className="flex min-w-0 items-center gap-2 text-base font-semibold text-stone-100">
        <Zap size={17} className="shrink-0 text-factory-su" />
        <span className="min-w-0 break-words">{data.label}</span>
      </div>
      <div className="mt-1 text-xs text-stone-500">{data.subtitle}</div>
      <div className="mt-2 text-sm font-semibold text-factory-su">
        {data.metrics?.Capacity}
      </div>
      <Handle
        type="source"
        position={vertical ? Position.Bottom : Position.Right}
        className="!bg-factory-su"
      />
    </div>
  );
}

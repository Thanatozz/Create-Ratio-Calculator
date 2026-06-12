import {
  Background,
  Controls,
  MarkerType,
  ReactFlow,
  useNodesState,
  type Edge,
  type Node,
  type ReactFlowInstance
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useEffect, useMemo, useState } from "react";
import type {
  ProductionGraph,
  ProductionGraphNodeData
} from "../../calculator-core/types";
import { layoutGraph } from "../../calculator-core/graph/layoutGraph";
import { useCalculatorStore } from "../../stores/calculatorStore";
import { useUiStore } from "../../stores/uiStore";
import { createIconPlaceholdersEnabled, itemIconMap } from "../../data/iconMaps";
import { ItemNode } from "./ItemNode";
import { MachineNode } from "./MachineNode";
import { SinkNode } from "./SinkNode";
import { SourceNode } from "./SourceNode";
import { SuGeneratorNode } from "./SuGeneratorNode";
import { WarningNode } from "./WarningNode";

const nodeTypes = {
  item: ItemNode,
  machine: MachineNode,
  source: SourceNode,
  sink: SinkNode,
  su_generator: SuGeneratorNode,
  warning: WarningNode
};

function filterGraph(graph: ProductionGraph, options: {
  showByproducts: boolean;
}): ProductionGraph {
  const hiddenNodeIds = new Set<string>();
  const byproductItemIds = new Set(
    graph.nodes
      .filter((node) => node.data.badge === "byproduct")
      .map((node) => node.id)
  );

  for (const node of graph.nodes) {
    if (!options.showByproducts && byproductItemIds.has(node.id)) {
      hiddenNodeIds.add(node.id);
    }
  }

  return {
    nodes: graph.nodes.filter((node) => !hiddenNodeIds.has(node.id)),
    edges: graph.edges.filter(
      (edge) => !hiddenNodeIds.has(edge.source) && !hiddenNodeIds.has(edge.target)
    )
  };
}

function toReactFlowNodes(graph: ProductionGraph): Node<ProductionGraphNodeData>[] {
  return graph.nodes.map((node) => ({
    id: node.id,
    type: node.type,
    position: node.position,
    data: node.data
  }));
}

function compactNumber(value: number | undefined): string {
  if (value === undefined) {
    return "";
  }

  return value.toLocaleString(undefined, {
    maximumFractionDigits: value >= 100 ? 0 : 1
  });
}

function fallbackIconLabel(itemId: string | undefined, label: string): string {
  if (!itemId) {
    return label.slice(0, 2).toUpperCase();
  }

  const path = itemId.split(":")[1] ?? itemId;
  const initials = path
    .split(/[_\s/-]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return initials || label.slice(0, 2).toUpperCase();
}

function compactEdgeLabel(edge: ProductionGraph["edges"][number]): string {
  const rate = compactNumber(edge.ratePerMinute);

  if (!createIconPlaceholdersEnabled) {
    return rate ? `${rate}/min` : edge.label;
  }

  const iconLabel = edge.itemId
    ? itemIconMap[edge.itemId]?.label ?? fallbackIconLabel(edge.itemId, edge.label)
    : fallbackIconLabel(edge.itemId, edge.label);

  return rate ? `${iconLabel} ${rate}/min` : iconLabel;
}

function toReactFlowEdges(graph: ProductionGraph): Edge[] {
  return graph.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: compactEdgeLabel(edge),
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: edge.bottleneck ? "#ef5f5f" : "#d6a84f"
    },
    style: {
      stroke: edge.bottleneck ? "#ef5f5f" : "#7b6844",
      strokeWidth: edge.bottleneck ? 3 : 2
    },
    labelStyle: {
      fill: "#f4efe5",
      fontSize: 10,
      fontWeight: 700
    },
    labelBgStyle: {
      fill: "#1b1a17",
      fillOpacity: 0.92
    },
    labelBgPadding: [5, 2]
  }));
}

export function GraphCanvas({ compact = false }: { compact?: boolean }) {
  const result = useCalculatorStore((state) => state.result);
  const setSelectedNodeId = useCalculatorStore((state) => state.setSelectedNodeId);
  const graphDirection = useUiStore((state) => state.graphDirection);
  const showByproducts = useUiStore((state) => state.showByproducts);
  const autoLayoutVersion = useUiStore((state) => state.autoLayoutVersion);
  const fitViewVersion = useUiStore((state) => state.fitViewVersion);
  const [laidOutGraph, setLaidOutGraph] = useState<ProductionGraph>(() => result.graph);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<ProductionGraphNodeData>>([]);
  const [flowInstance, setFlowInstance] =
    useState<ReactFlowInstance<Node<ProductionGraphNodeData>, Edge> | null>(null);
  const filteredGraph = useMemo(
    () => filterGraph(laidOutGraph, { showByproducts }),
    [laidOutGraph, showByproducts]
  );
  const edges = useMemo(() => toReactFlowEdges(filteredGraph), [filteredGraph]);

  useEffect(() => {
    let cancelled = false;
    layoutGraph(result.graph, graphDirection).then((nextGraph) => {
      if (!cancelled) {
        setLaidOutGraph(nextGraph);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [result.graph, graphDirection, autoLayoutVersion]);

  useEffect(() => {
    setNodes(toReactFlowNodes(filteredGraph));
  }, [filteredGraph, setNodes]);

  useEffect(() => {
    if (!flowInstance) {
      return;
    }

    window.setTimeout(() => {
      flowInstance.fitView({ padding: 0.18, duration: 220 });
    }, 0);
  }, [flowInstance, fitViewVersion, laidOutGraph]);

  return (
    <div className={`overflow-hidden rounded-md border border-factory-border bg-[#11100e] ${compact ? "h-[420px]" : "h-full min-h-[560px]"}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        onInit={setFlowInstance}
        onNodesChange={onNodesChange}
        nodesDraggable
        minZoom={0.25}
        maxZoom={1.8}
        onNodeClick={(_, node) => setSelectedNodeId(node.id)}
      >
        <Background color="#3a342a" gap={24} />
        <Controls className="!border-factory-border !bg-factory-panel !text-stone-100" />
      </ReactFlow>
    </div>
  );
}

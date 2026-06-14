import {
  Controls,
  MarkerType,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useReactFlow,
  type Edge,
  type Node
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  ProductionGraph,
  ProductionGraphNodeData
} from "../../calculator-core/types";
import { layoutGraph } from "../../calculator-core/graph/layoutGraph";
import { useIsMobile } from "../../hooks/useIsMobile";
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

function toReactFlowNodes(
  graph: ProductionGraph,
  direction: "RIGHT" | "DOWN"
): Node<ProductionGraphNodeData>[] {
  const vertical = direction === "DOWN";
  return graph.nodes.map((node) => ({
    id: node.id,
    type: node.type,
    position: node.position,
    data: { ...node.data, direction },
    sourcePosition: vertical ? Position.Bottom : Position.Right,
    targetPosition: vertical ? Position.Top : Position.Left
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

function GraphCanvasInner({ compact = false }: { compact?: boolean }) {
  const result = useCalculatorStore((state) => state.result);
  const setSelectedNodeId = useCalculatorStore((state) => state.setSelectedNodeId);
  const graphDirection = useUiStore((state) => state.graphDirection);
  const showByproducts = useUiStore((state) => state.showByproducts);
  const autoLayoutVersion = useUiStore((state) => state.autoLayoutVersion);
  const fitViewVersion = useUiStore((state) => state.fitViewVersion);
  const isMobile = useIsMobile();
  const { fitView } = useReactFlow();
  const containerRef = useRef<HTMLDivElement>(null);
  const [laidOutGraph, setLaidOutGraph] = useState<ProductionGraph>(() => result.graph);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<ProductionGraphNodeData>>([]);
  const filteredGraph = useMemo(
    () => filterGraph(laidOutGraph, { showByproducts }),
    [laidOutGraph, showByproducts]
  );
  const edges = useMemo(() => toReactFlowEdges(filteredGraph), [filteredGraph]);
  const fitPadding = isMobile ? 0.1 : 0.18;

  useEffect(() => {
    let cancelled = false;
    layoutGraph(result.graph, graphDirection, { compact: isMobile }).then((nextGraph) => {
      if (!cancelled) {
        setLaidOutGraph(nextGraph);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [result.graph, graphDirection, autoLayoutVersion, isMobile]);

  useEffect(() => {
    setNodes(toReactFlowNodes(filteredGraph, graphDirection));
  }, [filteredGraph, graphDirection, setNodes]);

  // Refit whenever the laid-out graph or an explicit fit request changes.
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      fitView({ padding: fitPadding, duration: 220 });
    });
    return () => cancelAnimationFrame(raf);
  }, [fitView, fitViewVersion, laidOutGraph, fitPadding]);

  // Refit when the container resizes (panel expand/collapse, orientation, etc.)
  // so nodes stay visible on mobile even if React Flow initialised at a small size.
  useEffect(() => {
    const element = containerRef.current;
    if (!element || typeof ResizeObserver === "undefined") {
      return;
    }
    let raf = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => fitView({ padding: fitPadding, duration: 0 }));
    });
    observer.observe(element);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [fitView, fitPadding]);

  return (
    <div
      ref={containerRef}
      className={`create-graph-canvas overflow-hidden ${
        compact
          ? "h-[420px]"
          : isMobile
            ? "h-[70vh] min-h-[420px]"
            : "h-full min-h-[480px]"
      }`}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: fitPadding }}
        onNodesChange={onNodesChange}
        nodesDraggable={!isMobile}
        nodesConnectable={false}
        elementsSelectable
        panOnDrag
        zoomOnPinch
        zoomOnScroll
        panOnScroll={false}
        minZoom={isMobile ? 0.1 : 0.25}
        maxZoom={1.8}
        onNodeClick={(_, node) => setSelectedNodeId(node.id)}
      >
        <Controls className="!border-factory-border !bg-factory-panel !text-stone-100" />
      </ReactFlow>
    </div>
  );
}

export function GraphCanvas({ compact = false }: { compact?: boolean }) {
  return (
    <ReactFlowProvider>
      <GraphCanvasInner compact={compact} />
    </ReactFlowProvider>
  );
}

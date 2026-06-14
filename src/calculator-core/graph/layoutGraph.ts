import ELK from "elkjs/lib/elk.bundled.js";
import type {
  ProductionGraph,
  ProductionGraphEdge,
  ProductionGraphNode
} from "./graphTypes";

const elk = new ELK();

export async function layoutGraph(
  graph: ProductionGraph,
  direction: "RIGHT" | "DOWN" = "RIGHT",
  options: { compact?: boolean } = {}
): Promise<ProductionGraph> {
  const compact = options.compact ?? false;
  const machineWidth = compact ? 208 : 288;
  const itemWidth = compact ? 168 : 240;

  const layout = await elk.layout({
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": direction,
      "elk.spacing.nodeNode": compact ? "36" : "56",
      "elk.layered.spacing.nodeNodeBetweenLayers": compact ? "60" : "96"
    },
    children: graph.nodes.map((node) => ({
      id: node.id,
      width: node.type === "machine" ? machineWidth : itemWidth,
      height: node.type === "warning" ? 120 : node.type === "machine" ? 142 : 112
    })),
    edges: graph.edges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target]
    }))
  });

  const positions = new Map(
    layout.children?.map((child) => [
      child.id,
      { x: child.x ?? 0, y: child.y ?? 0 }
    ]) ?? []
  );

  return {
    nodes: graph.nodes.map<ProductionGraphNode>((node) => ({
      ...node,
      position: positions.get(node.id) ?? node.position
    })),
    edges: graph.edges.map<ProductionGraphEdge>((edge) => ({ ...edge }))
  };
}

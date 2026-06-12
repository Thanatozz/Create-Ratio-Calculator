import type {
  CalculatorWarning,
  MachineRequirement,
  ProductionGraph,
  ProductionGraphEdge,
  ProductionGraphNode,
  ProductionGraphNodeData,
  SolverOutput
} from "../types";

function formatRate(rate: number | undefined): string {
  if (rate === undefined) {
    return "";
  }

  return `${rate.toFixed(rate >= 100 ? 0 : 2)}/min`;
}

function nodeData(
  label: string,
  subtitle?: string,
  metrics?: Record<string, string>,
  raw?: unknown,
  badge?: string
): ProductionGraphNodeData {
  return { label, subtitle, metrics, raw, badge };
}

function pushNode(
  nodes: Map<string, ProductionGraphNode>,
  node: Omit<ProductionGraphNode, "position">
): void {
  if (nodes.has(node.id)) {
    return;
  }

  const typeOrder: Record<ProductionGraphNode["type"], number> = {
    source: 0,
    su_generator: 0,
    item: 1,
    machine: 2,
    sink: 3,
    warning: 4
  };
  const sameTypeCount = [...nodes.values()].filter(
    (existing) => existing.type === node.type
  ).length;

  nodes.set(node.id, {
    ...node,
    position: {
      x: 80 + typeOrder[node.type] * 280,
      y: 60 + sameTypeCount * 150
    }
  });
}

function pushEdge(edges: ProductionGraphEdge[], edge: ProductionGraphEdge): void {
  if (edges.some((existing) => existing.id === edge.id)) {
    return;
  }

  edges.push(edge);
}

function addMachineNode(
  nodes: Map<string, ProductionGraphNode>,
  machine: MachineRequirement
): void {
  const machineLabel =
    machine.role === "fixed_machine"
      ? `x${machine.count}`
      : machine.role === "input_provider"
        ? `x${machine.count}`
        : `x${machine.count}`;
  const badge =
    machine.role === "fixed_machine"
      ? "fixedMachine"
      : machine.role === "input_provider"
        ? "inputProvider"
        : machine.utilizationStatus;

  pushNode(nodes, {
    id: machine.nodeId,
    type: "machine",
    data: nodeData(
      machine.machineName,
      `${machineLabel} • ${machine.rpm} RPM`,
      {
        SU: machine.stress.totalSu.toLocaleString(),
        Available: formatRate(machine.availableRatePerMinute),
        Required: formatRate(machine.requiredRatePerMinute),
        Approx: `${machine.approximate.machineCount}`,
        Realistic: `${machine.realistic.recommendedCount ?? machine.realistic.machineCount}`,
        Source: machine.recipeSourceName ?? "Create Base",
        Utilization: `${(machine.utilization * 100).toFixed(1)}%`
      },
      machine,
      badge
    )
  });
}

export function buildGraph(result: SolverOutput): ProductionGraph {
  const nodes = new Map<string, ProductionGraphNode>();
  const edges: ProductionGraphEdge[] = [];
  const targetItemNodeId = `item:${result.target.targetItemId}`;

  for (const machine of result.machines) {
    addMachineNode(nodes, machine);
  }

  const inputFlows = result.itemFlows.filter((flow) => flow.kind === "input");
  const outputFlows = result.itemFlows.filter((flow) => flow.kind === "output");
  const byproductFlows = result.itemFlows.filter((flow) => flow.kind === "byproduct");

  for (const flow of inputFlows) {
    const upstreamOutput = outputFlows.find(
      (candidate) =>
        candidate.itemId === flow.itemId &&
        candidate.targetNodeId === `item:${flow.itemId}` &&
        candidate.sourceNodeId !== flow.targetNodeId
    );

    if (upstreamOutput && nodes.has(upstreamOutput.sourceNodeId)) {
      pushEdge(edges, {
        id: `edge:collapsed:${upstreamOutput.sourceNodeId}:${flow.targetNodeId}:${flow.itemId}`,
        source: upstreamOutput.sourceNodeId,
        target: flow.targetNodeId,
        label: `${flow.itemName} ${formatRate(flow.ratePerMinute)}`,
        itemId: flow.itemId,
        ratePerMinute: flow.ratePerMinute,
        bottleneck: flow.bottleneck
      });
      continue;
    }

    pushNode(nodes, {
      id: `item:${flow.itemId}`,
      type: "item",
      data: nodeData(
        flow.itemName,
        flow.itemId,
        { Rate: formatRate(flow.ratePerMinute), Source: "Input" },
        flow,
        "input"
      )
    });

    pushEdge(edges, {
      id: `edge:${flow.id}`,
      source: `item:${flow.itemId}`,
      target: flow.targetNodeId,
      label: `${flow.itemName} ${formatRate(flow.ratePerMinute)}`,
      itemId: flow.itemId,
      ratePerMinute: flow.ratePerMinute,
      bottleneck: flow.bottleneck
    });
  }

  for (const flow of [...outputFlows, ...byproductFlows]) {
    const consumedElsewhere = inputFlows.some(
      (input) =>
        input.itemId === flow.itemId &&
        input.targetNodeId !== flow.sourceNodeId &&
        flow.itemId !== result.target.targetItemId
    );

    if (consumedElsewhere && flow.kind !== "byproduct") {
      continue;
    }

    pushNode(nodes, {
      id: `item:${flow.itemId}`,
      type: "item",
      data: nodeData(
        flow.itemName,
        flow.itemId,
        { Rate: formatRate(flow.ratePerMinute) },
        flow,
        flow.kind === "byproduct" ? "byproduct" : undefined
      )
    });

    pushEdge(edges, {
      id: `edge:${flow.id}`,
      source: flow.sourceNodeId,
      target: `item:${flow.itemId}`,
      label: `${flow.itemName} ${formatRate(flow.ratePerMinute)}`,
      itemId: flow.itemId,
      ratePerMinute: flow.ratePerMinute,
      bottleneck: flow.bottleneck
    });
  }

  result.warnings
    .filter((warning): warning is CalculatorWarning => warning.severity === "error")
    .forEach((warning) => {
      pushNode(nodes, {
        id: `warning:${warning.id}`,
        type: "warning",
        data: nodeData(warning.title, warning.message, undefined, warning, warning.severity)
      });

      if (warning.nodeId) {
        pushEdge(edges, {
          id: `edge:warning:${warning.id}`,
          source: warning.nodeId,
          target: `warning:${warning.id}`,
          label: "warning"
        });
      }
    });

  const targetNode = nodes.get(targetItemNodeId);
  if (targetNode) {
    targetNode.data = {
      ...targetNode.data,
      badge: result.calculationMode === "fixed_machines" ? "output" : "target"
    };
  }

  return {
    nodes: [...nodes.values()],
    edges
  };
}

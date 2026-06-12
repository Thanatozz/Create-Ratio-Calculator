import { describe, expect, it } from "vitest";
import { buildGraph } from "../calculator-core/graph/buildGraph";
import { solveProduction } from "../calculator-core/solver/solveProduction";

describe("graph generation", () => {
  it("builds nodes and edges for the example scenario", () => {
    const result = solveProduction({
      targetItemId: "minecraft:gravel",
      targetRatePerMinute: 1113,
      mode: "realistic",
      rpm: 256,
      stackSize: 64,
      transportMode: "brass_funnel",
      realisticEfficiency: 0.85,
      suMargin: 0.15
    });
    const graph = buildGraph(result);

    expect(graph.nodes.some((node) => node.type === "machine")).toBe(true);
    expect(graph.nodes.some((node) => node.type === "source")).toBe(false);
    expect(graph.nodes.some((node) => node.type === "su_generator")).toBe(false);
    expect(graph.nodes.some((node) => node.type === "sink")).toBe(false);
    expect(
      graph.edges.some(
        (edge) =>
          edge.source.includes("mechanical_drill") &&
          edge.target.includes("crushing_wheel_pair")
      )
    ).toBe(true);
    expect(graph.edges.length).toBeGreaterThan(0);
  });
});

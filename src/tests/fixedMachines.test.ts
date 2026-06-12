import { describe, expect, it } from "vitest";
import { buildProductionRows } from "../app/tabs/FactoryTab";
import { solveFixedMachines } from "../calculator-core/solver/solveFixedMachines";
import { recipes } from "../data/create-1.21.1/recipes";

function solveExample() {
  return solveFixedMachines({
    calculationMode: "fixed_machines",
    machineId: "create:crushing_wheel_pair",
    recipeId: "create:crushing/cobblestone",
    machineCount: 1,
    rpm: 256,
    mode: "realistic",
    transportMode: "brass_funnel",
    stackSize: 64,
    realisticEfficiency: 0.85,
    suMargin: 0.15
  });
}

describe("fixed machines mode", () => {
  it("calculates output for one crushing wheel pair", () => {
    const result = solveExample();
    const fixedMachine = result.machines.find(
      (machine) => machine.role === "fixed_machine"
    );

    expect(result.calculationMode).toBe("fixed_machines");
    expect(result.target.targetItemId).toBe("minecraft:gravel");
    expect(result.target.targetRatePerMinute).toBeCloseTo(1113.04, 1);
    expect(fixedMachine?.count).toBe(1);
    expect(fixedMachine?.utilizationStatus).toBe("exact_target");
  });

  it("calculates fixed machine input requirements", () => {
    const result = solveExample();
    const cobbleInput = result.itemFlows.find(
      (flow) =>
        flow.itemId === "minecraft:cobblestone" &&
        flow.kind === "input" &&
        flow.targetNodeId === result.fixedMachine?.nodeId
    );

    expect(cobbleInput?.ratePerMinute).toBeCloseTo(1113.04, 1);
  });

  it("calculates upstream drill recommendations and SU", () => {
    const result = solveExample();
    const drills = result.machines.find(
      (machine) => machine.machineId === "create:mechanical_drill"
    );
    const crusher = result.machines.find(
      (machine) => machine.machineId === "create:crushing_wheel_pair"
    );

    expect(drills?.approximate.machineCount).toBe(7);
    expect(drills?.realistic.machineCount).toBe(11);
    expect(drills?.realistic.recommendedCount).toBe(12);
    expect(crusher?.stress.totalSu).toBe(4096);
    expect(drills?.stress.totalSu).toBe(12288);
    expect(result.su.consumedSu).toBe(16384);
    expect(result.su.recommendedSu).toBe(18842);
  });

  it("marks the selected graph machine with a fixed badge", () => {
    const result = solveExample();
    const fixedNode = result.graph.nodes.find(
      (node) => node.id === result.fixedMachine?.nodeId
    );

    expect(fixedNode?.data.badge).toBe("fixedMachine");
    expect(fixedNode?.data.subtitle).toContain("x1");
  });

  it("builds fixed-machine factory rows", () => {
    const rows = buildProductionRows(solveExample(), true);

    expect(rows.some((row) => row.role === "Fixed machine")).toBe(true);
    expect(rows.some((row) => row.role === "Input provider")).toBe(true);
    expect(rows.some((row) => row.role === "Output")).toBe(true);
    expect(rows.some((row) => row.role === "Input")).toBe(true);
  });

  it("does not warn because the fixed machine is exactly utilized", () => {
    const result = solveExample();

    expect(
      result.warnings.some((warning) => warning.title === "Very tight machine load")
    ).toBe(false);
    expect(
      result.warnings.some((warning) => warning.title === "Bottleneck")
    ).toBe(false);
  });

  it("has fixed-machine starter recipes for drill, saw, fans, millstone, and deployer", () => {
    const machineIdsWithRecipes = new Set(recipes.map((recipe) => recipe.machineId));

    expect(machineIdsWithRecipes.has("create:mechanical_drill")).toBe(true);
    expect(machineIdsWithRecipes.has("create:mechanical_saw")).toBe(true);
    expect(machineIdsWithRecipes.has("create:encased_fan_washing")).toBe(true);
    expect(machineIdsWithRecipes.has("create:encased_fan_haunting")).toBe(true);
    expect(machineIdsWithRecipes.has("create:millstone")).toBe(true);
    expect(machineIdsWithRecipes.has("create:deployer")).toBe(true);
  });

  it.each([
    ["create:mechanical_drill", "create:drilling/cobblestone_generator"],
    ["create:mechanical_saw", "create:cutting/oak_log"],
    ["create:encased_fan_washing", "create:fan_washing/sand"],
    ["create:encased_fan_haunting", "create:fan_haunting/sand"],
    ["create:millstone", "create:milling/wheat"]
  ])("solves fixed-machine mode for %s", (machineId, recipeId) => {
    const result = solveFixedMachines({
      calculationMode: "fixed_machines",
      machineId,
      recipeId,
      machineCount: 1,
      rpm: 256,
      mode: "realistic",
      transportMode: "brass_funnel",
      stackSize: 64,
      realisticEfficiency: 0.85,
      suMargin: 0.15
    });
    const fixedMachine = result.machines.find(
      (machine) => machine.role === "fixed_machine"
    );

    expect(result.calculationMode).toBe("fixed_machines");
    expect(fixedMachine?.machineId).toBe(machineId);
    expect(fixedMachine?.count).toBe(1);
    expect(result.target.targetRatePerMinute).toBeGreaterThan(0);
    expect(result.su.consumedSu).toBeGreaterThan(0);
  });
});

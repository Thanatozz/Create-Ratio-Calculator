import { ChevronRight, CircleAlert, ListTree, Package } from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import type { MachineRequirement, SolverOutput, UtilizationStatus } from "../../calculator-core/types";
import { CreateIcon } from "../../components/icons/CreateIcon";
import { itemById } from "../../data/create-1.21.1/items";
import { transportModes } from "../../data/create-1.21.1/transport";
import { useTranslation } from "../../i18n";
import { useCalculatorStore } from "../../stores/calculatorStore";
import { useSettingsStore } from "../../stores/settingsStore";
import { useUiStore } from "../../stores/uiStore";
import {
  formatNumber,
  formatRate,
  formatSu
} from "../../components/ui/format";

type ProductionRowKind = "input" | "process" | "output" | "byproduct" | "su";

export type ProductionRowRole =
  | "Target"
  | "Fixed machine"
  | "Input provider"
  | "Intermediate"
  | "Byproduct"
  | "Raw input"
  | "Output"
  | "Input"
  | "SU generator";

export interface ProductionRow {
  id: string;
  kind: ProductionRowKind;
  role: ProductionRowRole;
  item: string;
  itemId?: string;
  ratePerMinute?: number;
  rateText?: string;
  transport: string;
  machine: string;
  machineCount: string;
  rpm: string;
  su?: number;
  utilizationStatus?: UtilizationStatus;
  utilization?: number;
  warnings: string[];
  details: string[];
  machineRequirement?: MachineRequirement;
}

function itemName(itemId: string): string {
  return itemById[itemId]?.name ?? itemId;
}

function machineFlowLabel(result: SolverOutput, machine: MachineRequirement): string {
  const inputs = result.itemFlows
    .filter((flow) => flow.targetNodeId === machine.nodeId && flow.kind === "input")
    .map((flow) => flow.itemName);
  const outputs = result.itemFlows
    .filter((flow) => flow.sourceNodeId === machine.nodeId && flow.kind === "output")
    .map((flow) => flow.itemName);

  if (inputs.length > 0 && outputs.length > 0) {
    return `${inputs.join(" + ")} -> ${outputs.join(" + ")}`;
  }

  return itemName(machine.outputItemId);
}

export function buildProductionRows(
  result: SolverOutput,
  showAdvancedRows = false
): ProductionRow[] {
  const rows: ProductionRow[] = [];
  const drill = result.machines.find(
    (machine) => machine.machineId === "create:mechanical_drill"
  );
  const transport = transportModes[result.target.transportMode];

  for (const resource of result.rawInputs) {
    const isGeneratedCobble =
      resource.itemId === "minecraft:cobblestone" && resource.source === "generated";
    const sourceMachine = isGeneratedCobble ? drill : undefined;
    const surplus = sourceMachine
      ? sourceMachine.availableRatePerMinute - sourceMachine.requiredRatePerMinute
      : 0;

    rows.push({
      id: `input:${resource.id}`,
      kind: "input",
      role: sourceMachine ? "Input provider" : "Raw input",
      item: `${resource.itemName} input`,
      itemId: resource.itemId,
      ratePerMinute: resource.ratePerMinute,
      rateText: sourceMachine
        ? `${formatNumber(sourceMachine.availableRatePerMinute)} ${resource.itemName}/min`
        : `${formatNumber(resource.ratePerMinute)} /min`,
      transport: resource.sourceName,
      machine: sourceMachine?.machineName ?? resource.sourceName,
      machineCount: sourceMachine ? String(sourceMachine.count) : "-",
      rpm: sourceMachine ? String(sourceMachine.rpm) : "-",
      su: sourceMachine?.stress.totalSu,
      utilizationStatus: sourceMachine?.utilizationStatus,
      utilization: sourceMachine?.utilization,
      warnings: sourceMachine?.warnings ?? [],
      machineRequirement: sourceMachine,
      details: sourceMachine
        ? [
            `Approximate minimum: ${sourceMachine.approximate.machineCount}`,
            `Realistic minimum: ${sourceMachine.realistic.machineCount}`,
            `Recommended: ${sourceMachine.realistic.recommendedCount ?? sourceMachine.count}`,
            `Realistic rate per drill: ${formatRate(sourceMachine.realistic.throughputPerMachine)}`,
            `Total realistic input: ${formatRate(sourceMachine.availableRatePerMinute)}`,
            `Input surplus: ${formatRate(surplus)}`
          ]
        : [`Source: ${resource.sourceName}`]
    });
  }

  for (const machine of result.machines.filter(
    (candidate) => candidate.machineId !== "create:mechanical_drill"
  )) {
    const inputFlows = result.itemFlows.filter(
      (flow) => flow.targetNodeId === machine.nodeId && flow.kind === "input"
    );
    const outputFlows = result.itemFlows.filter(
      (flow) => flow.sourceNodeId === machine.nodeId && flow.kind === "output"
    );
    const consumes = inputFlows
      .map((flow) => `${formatRate(flow.ratePerMinute)} ${flow.itemName}`)
      .join(", ");
    const produces = outputFlows
      .map((flow) => `${formatRate(flow.ratePerMinute)} ${flow.itemName}`)
      .join(", ");

    rows.push({
      id: `process:${machine.id}`,
      kind: "process",
      role:
        machine.role === "fixed_machine"
          ? "Fixed machine"
          : machine.role === "target"
            ? "Target"
            : "Intermediate",
      item:
        machine.role === "fixed_machine"
          ? machine.machineName
          : machineFlowLabel(result, machine),
      itemId: machine.role === "fixed_machine" ? machine.recipeId : machine.outputItemId,
      ratePerMinute: machine.requiredRatePerMinute,
      rateText: outputFlows.length
        ? outputFlows
            .map((flow) => `${formatNumber(flow.ratePerMinute)} ${flow.itemName}/min`)
            .join(", ")
        : formatRate(machine.requiredRatePerMinute),
      transport: `${transport.name} (${transport.inputDelayTicks} ticks)`,
      machine: machine.machineName,
      machineCount: String(machine.count),
      rpm: String(machine.rpm),
      su: machine.stress.totalSu,
      utilizationStatus: machine.utilizationStatus,
      utilization: machine.utilization,
      warnings: machine.warnings,
      machineRequirement: machine,
      details: [
        `Consumes: ${consumes || "n/a"}`,
        `Produces: ${produces || "n/a"}`,
        `Recipe source: ${machine.recipeSourceName ?? "Create Base"}`,
        machine.role === "fixed_machine"
          ? `Approximate output: ${formatRate(machine.approximate.availableRatePerMinute)}`
          : `Approximate: ${machine.approximate.machineCount} machine(s), ${formatRate(machine.approximate.throughputPerMachine)} each`,
        machine.role === "fixed_machine"
          ? `Realistic output: ${formatRate(machine.realistic.availableRatePerMinute)}`
          : `Realistic: ${machine.realistic.machineCount} machine(s), ${formatRate(machine.realistic.throughputPerMachine)} each`,
        machine.role === "fixed_machine" &&
        Math.abs(machine.approximate.availableRatePerMinute - machine.realistic.availableRatePerMinute) < 0.01
          ? "Realistic mode does not reduce this selected machine throughput; it mainly affects upstream physical sources and safety margins."
          : `Recommended: ${machine.realistic.recommendedCount ?? machine.realistic.machineCount}`,
        `SU: ${formatSu(machine.stress.totalSu)}`
      ]
    });
  }

  const fixedMachine = result.machines.find(
    (machine) => machine.role === "fixed_machine"
  );

  if (showAdvancedRows && result.calculationMode === "fixed_machines" && fixedMachine) {
    const fixedInputFlows = result.itemFlows.filter(
      (flow) => flow.targetNodeId === fixedMachine.nodeId && flow.kind === "input"
    );

    for (const flow of fixedInputFlows) {
      rows.push({
        id: `required-input:${flow.id}`,
        kind: "input",
        role: "Input",
        item: flow.itemName,
        itemId: flow.itemId,
        ratePerMinute: flow.ratePerMinute,
        rateText: `${formatNumber(flow.ratePerMinute)} /min required`,
        transport: "Required by fixed machine",
        machine: fixedMachine.machineName,
        machineCount: "-",
        rpm: "-",
        warnings: [],
        details: [
          `${fixedMachine.machineName} consumes ${formatRate(flow.ratePerMinute)} ${flow.itemName}.`,
          `Input route is provided by upstream rows.`
        ]
      });
    }
  }

  for (const byproduct of result.byproducts) {
    rows.push({
      id: `byproduct:${byproduct.id}`,
      kind: "byproduct",
      role: "Byproduct",
      item: byproduct.itemName,
      itemId: byproduct.itemId,
      ratePerMinute: byproduct.ratePerMinute,
      rateText: `${formatNumber(byproduct.ratePerMinute)} /min expected`,
      transport: "Byproduct output",
      machine: byproduct.fromRecipeId,
      machineCount: "-",
      rpm: "-",
      warnings: [],
      details: [
        `Expected rate: ${formatRate(byproduct.ratePerMinute)}`,
        `Output chance: ${formatNumber(byproduct.chance * 100, 0)}%`,
        `Recipe: ${byproduct.fromRecipeId}`
      ]
    });
  }

  if (showAdvancedRows) {
    rows.push({
      id: `output:${result.target.targetItemId}`,
      kind: "output",
      role: result.calculationMode === "fixed_machines" ? "Output" : "Target",
      item: `${itemName(result.target.targetItemId)} output`,
      itemId: result.target.targetItemId,
      ratePerMinute: result.target.targetRatePerMinute,
      rateText: `${formatNumber(result.target.targetRatePerMinute)} /min`,
      transport: "Factory output",
      machine: "Target sink",
      machineCount: "-",
      rpm: "-",
      utilizationStatus: "exact_target",
      utilization: 1,
      warnings: [],
      details: [
        `Desired output: ${formatRate(result.target.targetRatePerMinute)}`,
        `Planning mode: ${result.target.mode}`,
        `Both approximate and realistic machine counts are shown in process rows.`
      ]
    });
  }

  if (result.calculationMode === "fixed_machines") {
    const order: Record<ProductionRowRole, number> = {
      "Fixed machine": 0,
      "Input provider": 1,
      Output: 2,
      Input: 3,
      Intermediate: 4,
      Byproduct: 5,
      "Raw input": 6,
      Target: 7,
      "SU generator": 8
    };

    return rows.sort((a, b) => order[a.role] - order[b.role]);
  }

  return rows;
}

function roleLabel(role: ProductionRowRole, t: ReturnType<typeof useTranslation>) {
  switch (role) {
    case "Target":
      return t("resources.target");
    case "Fixed machine":
      return t("badge.fixedMachine");
    case "Input provider":
      return t("badge.inputProvider");
    case "Intermediate":
      return t("resources.input");
    case "Byproduct":
      return t("resources.byproduct");
    case "Raw input":
      return t("resources.baseMaterial");
    case "Output":
      return t("resources.target");
    case "Input":
      return t("resources.input");
    case "SU generator":
      return t("su.generator");
  }
}

function CompactStat({
  label,
  value,
  detail,
  tone = "text-stone-100"
}: {
  label: string;
  value: string;
  detail?: string;
  tone?: string;
}) {
  return (
    <div className="min-w-0 rounded-md border border-factory-border bg-factory-panel px-3 py-2">
      <div className="truncate text-[11px] uppercase tracking-wide text-stone-500">
        {label}
      </div>
      <div className={`truncate text-base font-semibold ${tone}`}>{value}</div>
      {detail ? <div className="truncate text-xs text-stone-500">{detail}</div> : null}
    </div>
  );
}

export function FactoryTab() {
  const result = useCalculatorStore((state) => state.result);
  const showAdvancedRows = useSettingsStore((state) => state.showAdvancedCalculations);
  const uiDensity = useUiStore((state) => state.uiDensity);
  const t = useTranslation();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const rows = useMemo(
    () => buildProductionRows(result, showAdvancedRows),
    [result, showAdvancedRows]
  );
  const requiredMachines = result.machines.reduce(
    (sum, machine) => sum + machine.count,
    0
  );
  const targetName = itemName(result.target.targetItemId);
  const rowPadding = uiDensity === "compact" ? "px-2 py-1.5" : "px-3 py-2.5";

  function toggleRow(rowId: string) {
    setExpandedRows((current) => {
      const next = new Set(current);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  }

  return (
    <div className="industrial-scrollbar min-h-0 overflow-auto p-3">
      <section className="grid gap-2 md:grid-cols-5">
        <CompactStat
          label={t("factory.output")}
          value={`${targetName} - ${formatRate(result.target.targetRatePerMinute)}`}
          tone="text-factory-brass"
        />
        <CompactStat
          label={t("factory.machines")}
          value={String(requiredMachines)}
          detail={t("factory.machineTypes", { count: result.machines.length })}
          tone="text-factory-copper"
        />
        <CompactStat
          label={t("factory.totalSu")}
          value={formatSu(result.su.consumedSu)}
          tone="text-factory-su"
        />
        <CompactStat
          label={t("factory.recommendedSu")}
          value={formatSu(result.su.recommendedSu)}
          detail={t("factory.margin", { value: Math.round(result.su.margin * 100) })}
          tone="text-factory-green"
        />
        <CompactStat
          label={t("factory.warnings")}
          value={String(result.warnings.length)}
          detail={result.warnings[0]?.title ?? t("common.noWarnings")}
          tone={result.warnings.some((warning) => warning.severity === "error") ? "text-factory-danger" : "text-factory-warning"}
        />
      </section>

      <section className="mt-3 rounded-md border border-factory-border bg-factory-panel">
        <div className="flex items-center gap-2 border-b border-factory-border px-3 py-2 text-xs uppercase tracking-wide text-stone-500">
          <ListTree size={14} className="text-factory-brass" />
          {t("factory.productionPlan")}
        </div>
        <div className="overflow-auto">
          <table className="w-full min-w-[860px] border-collapse text-left text-sm">
            <thead className="bg-factory-panel2 text-[11px] uppercase tracking-wide text-stone-500">
              <tr>
                <th className="w-9 px-2 py-2"></th>
                <th className="px-2 py-2">{t("factory.role")}</th>
                <th className="px-2 py-2">{t("factory.itemRecipe")}</th>
                <th className="px-2 py-2 text-right">{t("factory.rate")}</th>
                <th className="px-2 py-2">{t("factory.machine")}</th>
                <th className="px-2 py-2 text-right">{t("factory.count")}</th>
                <th className="px-2 py-2 text-right">{t("factory.rpm")}</th>
                <th className="px-2 py-2 text-right">{t("factory.su")}</th>
                <th className="px-2 py-2 text-right">{t("common.notes")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const expanded = expandedRows.has(row.id);
                return (
                  <Fragment key={row.id}>
                    <tr
                      key={row.id}
                      className="border-t border-factory-border/80 hover:bg-factory-panel2/60"
                    >
                      <td className={`${rowPadding} text-center`}>
                        <button
                          type="button"
                          className="inline-flex h-6 w-6 items-center justify-center rounded hover:bg-factory-border/60"
                          onClick={() => toggleRow(row.id)}
                          title={expanded ? "Collapse row" : "Expand row"}
                        >
                          <ChevronRight
                            size={15}
                            className={`transition ${expanded ? "rotate-90" : ""}`}
                          />
                        </button>
                      </td>
                      <td className={`${rowPadding} text-xs uppercase tracking-wide text-factory-brass`}>
                        {roleLabel(row.role, t)}
                      </td>
                      <td className={`${rowPadding} font-semibold text-stone-100`}>
                        <div className="flex items-center gap-2">
                          {row.machineRequirement ? (
                            <CreateIcon id={row.machineRequirement.machineId} kind="machine" />
                          ) : row.itemId ? (
                            <CreateIcon id={row.itemId} />
                          ) : (
                            <Package size={14} className="text-factory-brass" />
                          )}
                          <span>{row.item}</span>
                        </div>
                        {row.itemId ? (
                          <div className="text-[11px] font-normal text-stone-500">
                            {row.itemId}
                          </div>
                        ) : null}
                      </td>
                      <td className={`${rowPadding} text-right text-stone-200`}>
                        {row.rateText ??
                          (row.ratePerMinute === undefined
                            ? "-"
                            : formatNumber(row.ratePerMinute))}
                      </td>
                      <td className={`${rowPadding} text-stone-300`}>{row.machine}</td>
                      <td className={`${rowPadding} text-right text-stone-200`}>
                        {row.machineCount}
                      </td>
                      <td className={`${rowPadding} text-right text-stone-300`}>{row.rpm}</td>
                      <td className={`${rowPadding} text-right text-factory-su`}>
                        {row.su === undefined ? "-" : formatNumber(row.su, 0)}
                      </td>
                      <td className={`${rowPadding} text-right`}>
                        <button
                          type="button"
                          onClick={() => toggleRow(row.id)}
                          className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-xs ${
                            row.warnings.length > 0
                              ? "border-factory-warning/60 text-factory-warning"
                              : "border-factory-border text-stone-300"
                          }`}
                        >
                          {row.warnings.length > 0 ? <CircleAlert size={13} /> : null}
                          {row.utilizationStatus
                            ? t(`status.${row.utilizationStatus}`)
                            : t("common.notes")}
                        </button>
                      </td>
                    </tr>
                    {expanded ? (
                      <tr key={`${row.id}:details`} className="border-t border-factory-border/60 bg-[#141310]">
                        <td className="px-2 py-2" />
                        <td className="px-2 py-2 text-sm text-stone-300" colSpan={8}>
                          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                            {row.details.map((detail) => (
                              <div
                                key={detail}
                                className="rounded border border-factory-border bg-factory-panel2 px-2 py-1.5"
                              >
                                {detail}
                              </div>
                            ))}
                            {row.warnings.map((warning) => (
                              <div
                                key={warning}
                                className="rounded border border-factory-warning/40 bg-factory-panel2 px-2 py-1.5 text-factory-warning"
                              >
                                {warning}
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

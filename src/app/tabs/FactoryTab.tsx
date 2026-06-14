import { ChevronRight, CircleAlert, ListTree, Package } from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import type { MachineRequirement, SolverOutput, UtilizationStatus } from "../../calculator-core/types";
import { CreateIcon } from "../../components/icons/CreateIcon";
import { transportModes } from "../../data/create-1.21.1/transport";
import { translate, useTranslation } from "../../i18n";
import type { TranslationParams } from "../../i18n/types";
import { useCalculatorStore } from "../../stores/calculatorStore";
import { useSettingsStore } from "../../stores/settingsStore";
import { useUiStore } from "../../stores/uiStore";
import {
  formatNumber,
  formatRate,
  formatSu
} from "../../components/ui/format";
import {
  cleanGeneratedRecipeName,
  formatItemDisplayName,
  formatRecipeDisplayName,
  normalizeRecipeId
} from "../../components/ui/displayName";
import { CollapsiblePanel } from "../../components/ui/CollapsiblePanel";
import { CardField, MobileCard, MobileCardList } from "../../components/ui/MobileCard";
import { ProcessIcon } from "../../components/icons/ProcessIcon";

type Translator = (key: string, params?: TranslationParams) => string;

const defaultTranslator: Translator = (key, params) =>
  translate("en", key, params);

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
  processType?: string;
  warnings: string[];
  details: string[];
  machineRequirement?: MachineRequirement;
}

function machineFlowLabel(result: SolverOutput, machine: MachineRequirement): string {
  const inputs = result.itemFlows
    .filter((flow) => flow.targetNodeId === machine.nodeId && flow.kind === "input")
    .map((flow) => formatItemDisplayName(flow.itemId));
  const outputs = result.itemFlows
    .filter((flow) => flow.sourceNodeId === machine.nodeId && flow.kind === "output")
    .map((flow) => formatItemDisplayName(flow.itemId));

  if (inputs.length > 0 && outputs.length > 0) {
    return `${inputs.join(" + ")} → ${outputs.join(" + ")}`;
  }

  return formatItemDisplayName(machine.outputItemId);
}

export function buildProductionRows(
  result: SolverOutput,
  showAdvancedRows = false,
  t: Translator = defaultTranslator
): ProductionRow[] {
  const rows: ProductionRow[] = [];
  const drill = result.machines.find(
    (machine) => machine.machineId === "create:mechanical_drill"
  );
  const transport = transportModes[result.target.transportMode];
  const na = t("common.notAvailable");

  for (const resource of result.rawInputs) {
    const isGeneratedCobble =
      resource.itemId === "minecraft:cobblestone" && resource.source === "generated";
    const sourceMachine = isGeneratedCobble ? drill : undefined;
    const surplus = sourceMachine
      ? sourceMachine.availableRatePerMinute - sourceMachine.requiredRatePerMinute
      : 0;
    const resourceName = formatItemDisplayName(resource.itemId);

    rows.push({
      id: `input:${resource.id}`,
      kind: "input",
      role: sourceMachine ? "Input provider" : "Raw input",
      item: t("row.inputSuffix", { name: resourceName }),
      itemId: resource.itemId,
      ratePerMinute: resource.ratePerMinute,
      rateText: sourceMachine
        ? t("row.ratePerMinNamed", {
            value: formatNumber(sourceMachine.availableRatePerMinute),
            name: resourceName
          })
        : t("row.ratePerMin", { value: formatNumber(resource.ratePerMinute) }),
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
            t("row.approximateMinimum", { value: sourceMachine.approximate.machineCount }),
            t("row.realisticMinimum", { value: sourceMachine.realistic.machineCount }),
            t("row.recommended", {
              value: sourceMachine.realistic.recommendedCount ?? sourceMachine.count
            }),
            t("row.realisticRatePerDrill", {
              value: formatRate(sourceMachine.realistic.throughputPerMachine)
            }),
            t("row.totalRealisticInput", {
              value: formatRate(sourceMachine.availableRatePerMinute)
            }),
            t("row.inputSurplus", { value: formatRate(surplus) })
          ]
        : [t("row.source", { value: resource.sourceName })]
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
      .map((flow) => `${formatRate(flow.ratePerMinute)} ${formatItemDisplayName(flow.itemId)}`)
      .join(", ");
    const produces = outputFlows
      .map((flow) => `${formatRate(flow.ratePerMinute)} ${formatItemDisplayName(flow.itemId)}`)
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
            .map((flow) =>
              t("row.ratePerMinNamed", {
                value: formatNumber(flow.ratePerMinute),
                name: formatItemDisplayName(flow.itemId)
              })
            )
            .join(", ")
        : formatRate(machine.requiredRatePerMinute),
      transport: `${transport.name} (${transport.inputDelayTicks} ticks)`,
      machine: machine.machineName,
      machineCount: String(machine.count),
      rpm: String(machine.rpm),
      su: machine.stress.totalSu,
      processType: machine.recipeId
        ? normalizeRecipeId(machine.recipeId).process
        : undefined,
      utilizationStatus: machine.utilizationStatus,
      utilization: machine.utilization,
      warnings: machine.warnings,
      machineRequirement: machine,
      details: [
        t("row.consumes", { value: consumes || na }),
        t("row.produces", { value: produces || na }),
        t("row.recipeSource", {
          value: machine.recipeSourceName ?? t("recipeMenu.createBase")
        }),
        machine.role === "fixed_machine"
          ? t("row.approximateOutput", {
              value: formatRate(machine.approximate.availableRatePerMinute)
            })
          : t("row.approximate", {
              count: machine.approximate.machineCount,
              rate: formatRate(machine.approximate.throughputPerMachine)
            }),
        machine.role === "fixed_machine"
          ? t("row.realisticOutput", {
              value: formatRate(machine.realistic.availableRatePerMinute)
            })
          : t("row.realistic", {
              count: machine.realistic.machineCount,
              rate: formatRate(machine.realistic.throughputPerMachine)
            }),
        machine.role === "fixed_machine" &&
        Math.abs(machine.approximate.availableRatePerMinute - machine.realistic.availableRatePerMinute) < 0.01
          ? t("row.realisticNoReduce")
          : t("row.recommended", {
              value: machine.realistic.recommendedCount ?? machine.realistic.machineCount
            }),
        t("row.su", { value: formatSu(machine.stress.totalSu) })
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
      const flowName = formatItemDisplayName(flow.itemId);
      rows.push({
        id: `required-input:${flow.id}`,
        kind: "input",
        role: "Input",
        item: flowName,
        itemId: flow.itemId,
        ratePerMinute: flow.ratePerMinute,
        rateText: t("row.requiredPerMin", { value: formatNumber(flow.ratePerMinute) }),
        transport: t("row.requiredByFixed"),
        machine: fixedMachine.machineName,
        machineCount: "-",
        rpm: "-",
        warnings: [],
        details: [
          t("row.machineConsumes", {
            machine: fixedMachine.machineName,
            value: formatRate(flow.ratePerMinute),
            item: flowName
          }),
          t("row.inputUpstream")
        ]
      });
    }
  }

  for (const byproduct of result.byproducts) {
    rows.push({
      id: `byproduct:${byproduct.id}`,
      kind: "byproduct",
      role: "Byproduct",
      item: formatItemDisplayName(byproduct.itemId),
      itemId: byproduct.itemId,
      ratePerMinute: byproduct.ratePerMinute,
      rateText: t("row.expectedPerMin", { value: formatNumber(byproduct.ratePerMinute) }),
      transport: t("row.byproductOutput"),
      machine: formatRecipeDisplayName({ id: byproduct.fromRecipeId }),
      machineCount: "-",
      rpm: "-",
      processType: normalizeRecipeId(byproduct.fromRecipeId).process,
      warnings: [],
      details: [
        t("row.expectedRate", { value: formatRate(byproduct.ratePerMinute) }),
        t("row.outputChance", { value: formatNumber(byproduct.chance * 100, 0) }),
        t("row.recipe", { value: cleanGeneratedRecipeName(byproduct.fromRecipeId) })
      ]
    });
  }

  if (showAdvancedRows) {
    rows.push({
      id: `output:${result.target.targetItemId}`,
      kind: "output",
      role: result.calculationMode === "fixed_machines" ? "Output" : "Target",
      item: t("row.outputSuffix", {
        name: formatItemDisplayName(result.target.targetItemId)
      }),
      itemId: result.target.targetItemId,
      ratePerMinute: result.target.targetRatePerMinute,
      rateText: t("row.ratePerMin", {
        value: formatNumber(result.target.targetRatePerMinute)
      }),
      transport: t("row.factoryOutput"),
      machine: t("row.targetSink"),
      machineCount: "-",
      rpm: "-",
      utilizationStatus: "exact_target",
      utilization: 1,
      warnings: [],
      details: [
        t("row.desiredOutput", { value: formatRate(result.target.targetRatePerMinute) }),
        t("row.planningMode", { value: t(`mode.${result.target.mode}`) }),
        t("row.bothCounts")
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
    <div className="create-result-bar min-w-0 px-3 py-2">
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
  const developerMode = useSettingsStore((state) => state.developerMode);
  const language = useSettingsStore((state) => state.language);
  const uiDensity = useUiStore((state) => state.uiDensity);
  const t = useTranslation();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const rows = useMemo(
    () => buildProductionRows(result, showAdvancedRows, t),
    // `t` is a fresh closure each render; key on language instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [result, showAdvancedRows, language]
  );
  const requiredMachines = result.machines.reduce(
    (sum, machine) => sum + machine.count,
    0
  );
  const targetName = formatItemDisplayName(result.target.targetItemId);
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
    <div className="create-page industrial-scrollbar min-h-0 p-3 xl:h-full xl:overflow-auto">
      <div className="mx-auto grid w-full max-w-6xl gap-3">
      <CollapsiblePanel title={t("factory.summary")} bodyClassName="p-3">
        <div className="grid gap-2 md:grid-cols-3">
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
        </div>
      </CollapsiblePanel>

      <CollapsiblePanel
        title={t("factory.productionPlan")}
        icon={<ListTree size={14} className="text-factory-brass" />}
        bodyClassName="p-0"
      >
        <MobileCardList className="p-3">
          {rows.map((row) => {
            const expanded = expandedRows.has(row.id);
            const rateValue =
              row.rateText ??
              (row.ratePerMinute === undefined ? "-" : formatNumber(row.ratePerMinute));
            return (
              <MobileCard key={row.id}>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-factory-brass">
                    {roleLabel(row.role, t)}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleRow(row.id)}
                    className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-[11px] ${
                      row.warnings.length > 0
                        ? "border-factory-warning/60 text-factory-warning"
                        : "border-factory-border text-stone-300"
                    }`}
                  >
                    {row.warnings.length > 0 ? <CircleAlert size={12} /> : null}
                    {row.utilizationStatus
                      ? t(`status.${row.utilizationStatus}`)
                      : t("common.notes")}
                  </button>
                </div>
                <div className="flex items-center gap-2 font-semibold text-stone-100">
                  {row.machineRequirement ? (
                    <CreateIcon id={row.machineRequirement.machineId} kind="machine" />
                  ) : row.itemId ? (
                    <CreateIcon id={row.itemId} />
                  ) : (
                    <Package size={14} className="text-factory-brass" />
                  )}
                  <span className="min-w-0 break-words">{row.item}</span>
                </div>
                {developerMode && row.itemId ? (
                  <div className="-mt-1 text-[11px] text-stone-500">{row.itemId}</div>
                ) : null}
                <CardField label={t("factory.rate")} value={rateValue} />
                <CardField
                  label={t("factory.machine")}
                  value={
                    <span className="flex items-center justify-end gap-1.5">
                      {row.processType ? (
                        <ProcessIcon type={row.processType} size={14} />
                      ) : null}
                      <span className="min-w-0 break-words">{row.machine}</span>
                    </span>
                  }
                />
                <CardField label={t("factory.transport")} value={row.transport} />
                <CardField label={t("factory.count")} value={row.machineCount} />
                <CardField label={t("factory.rpm")} value={row.rpm} />
                <CardField
                  label={t("factory.su")}
                  value={row.su === undefined ? "-" : formatNumber(row.su, 0)}
                  valueClassName="text-factory-su"
                />
                <button
                  type="button"
                  onClick={() => toggleRow(row.id)}
                  className="mt-1 flex items-center justify-center gap-1 rounded border border-factory-border py-1.5 text-xs text-stone-300"
                  aria-expanded={expanded}
                >
                  <ChevronRight
                    size={14}
                    className={`transition ${expanded ? "rotate-90" : ""}`}
                  />
                  {expanded ? t("row.collapse") : t("common.details")}
                </button>
                {expanded ? (
                  <div className="grid gap-1.5 text-sm text-stone-300">
                    {row.details.map((detail) => (
                      <div
                        key={detail}
                        className="rounded border border-factory-border bg-factory-panel px-2 py-1.5"
                      >
                        {detail}
                      </div>
                    ))}
                    {row.warnings.map((warning) => (
                      <div
                        key={warning}
                        className="rounded border border-factory-warning/40 bg-factory-panel px-2 py-1.5 text-factory-warning"
                      >
                        {warning}
                      </div>
                    ))}
                  </div>
                ) : null}
              </MobileCard>
            );
          })}
        </MobileCardList>
        <div className="industrial-scrollbar hidden overflow-x-auto md:block">
          <table className="create-technical-table w-full min-w-[960px] border-collapse text-left text-sm">
            <thead className="text-[11px] uppercase tracking-wide text-stone-500">
              <tr>
                <th className="w-9 px-2 py-2"></th>
                <th className="px-2 py-2">{t("factory.role")}</th>
                <th className="px-2 py-2">{t("factory.itemRecipe")}</th>
                <th className="px-2 py-2 text-right">{t("factory.rate")}</th>
                <th className="px-2 py-2">{t("factory.transport")}</th>
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
                          title={expanded ? t("row.collapse") : t("row.expand")}
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
                          <span className="min-w-0 break-words">{row.item}</span>
                        </div>
                        {developerMode && row.itemId ? (
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
                      <td className={`${rowPadding} text-stone-300`}>{row.transport}</td>
                      <td className={`${rowPadding} text-stone-300`}>
                        <span className="flex items-center gap-1.5">
                          {row.processType ? (
                            <ProcessIcon type={row.processType} size={14} />
                          ) : null}
                          <span className="min-w-0 break-words">{row.machine}</span>
                        </span>
                      </td>
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
                        <td className="px-2 py-2 text-sm text-stone-300" colSpan={9}>
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
      </CollapsiblePanel>
      </div>
    </div>
  );
}

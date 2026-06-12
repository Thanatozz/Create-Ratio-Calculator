import { CircleGauge, FileJson, Workflow, Zap } from "lucide-react";
import type { MachineRequirement, ProductionGraphNode } from "../../calculator-core/types";
import { useCalculatorStore } from "../../stores/calculatorStore";
import { formatPercent, formatRate, formatSu, utilizationClass, utilizationLabel } from "../ui/format";
import { WarningList } from "../cards/WarningList";

function isMachineRequirement(value: unknown): value is MachineRequirement {
  return (
    typeof value === "object" &&
    value !== null &&
    "machineId" in value &&
    "stress" in value
  );
}

function DetailMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-factory-border bg-factory-panel2 p-3">
      <div className="text-xs uppercase tracking-wide text-stone-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-stone-100">{value}</div>
    </div>
  );
}

export function DetailsSidebar() {
  const result = useCalculatorStore((state) => state.result);
  const selectedNodeId = useCalculatorStore((state) => state.selectedNodeId);
  const selectedNode = result.graph.nodes.find((node) => node.id === selectedNodeId);
  const selectedMachine = isMachineRequirement(selectedNode?.data.raw)
    ? selectedNode.data.raw
    : undefined;

  return (
    <aside className="industrial-scrollbar min-h-0 overflow-auto border-l border-factory-border bg-factory-panel/90 p-4">
      <div className="mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-factory-brass">
          Node Details
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          {selectedNode ? selectedNode.data.label : "Select a graph node for details."}
        </p>
      </div>

      {selectedNode ? (
        <SelectedNodePanel node={selectedNode} machine={selectedMachine} />
      ) : (
        <PlanOverview />
      )}

      <div className="mt-5">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-stone-200">
          <Workflow size={16} className="text-factory-warning" />
          Warnings
        </div>
        <WarningList warnings={result.warnings.slice(0, 4)} />
      </div>
    </aside>
  );
}

function SelectedNodePanel({
  node,
  machine
}: {
  node: ProductionGraphNode;
  machine?: MachineRequirement;
}) {
  return (
    <div className="grid gap-3">
      <div className="rounded-lg border border-factory-border bg-factory-panel p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-stone-100">
          <FileJson size={16} className="text-factory-copper" />
          {node.data.label}
        </div>
        {node.data.subtitle ? (
          <div className="mt-1 text-xs text-stone-500">{node.data.subtitle}</div>
        ) : null}
        {node.data.badge ? (
          <div className="mt-3 inline-flex rounded-full border border-factory-border px-2 py-1 text-xs text-factory-brass">
            {node.data.badge}
          </div>
        ) : null}
      </div>

      {node.data.metrics
        ? Object.entries(node.data.metrics).map(([label, value]) => (
            <DetailMetric key={label} label={label} value={value} />
          ))
        : null}

      {machine ? (
        <>
          <DetailMetric label="Approx ratio" value={`${machine.approximate.machineCount} machine(s)`} />
          <DetailMetric label="Realistic ratio" value={`${machine.realistic.machineCount} machine(s)`} />
          <DetailMetric label="SU cost" value={formatSu(machine.stress.totalSu)} />
          <DetailMetric
            label="Utilization"
            value={`${utilizationLabel(machine.utilizationStatus)} (${formatPercent(machine.utilization)})`}
          />
          <div className={`text-sm ${utilizationClass(machine.utilizationStatus)}`}>
            {machine.warnings[0] ?? "Machine has no local warnings."}
          </div>
        </>
      ) : null}
    </div>
  );
}

function PlanOverview() {
  const result = useCalculatorStore((state) => state.result);
  const targetMachine = result.machines[0];

  return (
    <div className="grid gap-3">
      <DetailMetric label="Desired output" value={formatRate(result.target.targetRatePerMinute)} />
      <DetailMetric label="Required machines" value={String(result.machines.reduce((sum, machine) => sum + machine.count, 0))} />
      <DetailMetric label="Total SU" value={formatSu(result.su.consumedSu)} />
      <DetailMetric label="Recommended SU" value={formatSu(result.su.recommendedSu)} />
      {targetMachine ? (
        <div className="rounded-lg border border-factory-border bg-factory-panel p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-stone-100">
            <CircleGauge size={16} className="text-factory-brass" />
            Primary machine
          </div>
          <div className="text-sm text-stone-400">{targetMachine.machineName}</div>
          <div className="mt-2 flex items-center gap-2 text-sm text-stone-300">
            <Zap size={14} className="text-factory-su" />
            {formatSu(targetMachine.stress.totalSu)}
          </div>
        </div>
      ) : null}
    </div>
  );
}

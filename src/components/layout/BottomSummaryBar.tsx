import { Activity, Gauge, Package, TriangleAlert, Zap } from "lucide-react";
import { useCalculatorStore } from "../../stores/calculatorStore";
import { formatRate, formatSu } from "../ui/format";

export function BottomSummaryBar() {
  const result = useCalculatorStore((state) => state.result);
  const totalInputPerMinute = result.rawInputs.reduce(
    (total, input) => total + input.ratePerMinute,
    0
  );
  const bottlenecks = result.machines.filter(
    (machine) => machine.utilizationStatus === "bottleneck"
  ).length;
  const tightMachines = result.machines.filter(
    (machine) => machine.utilizationStatus === "very_tight"
  ).length;

  return (
    <footer className="grid min-h-10 grid-cols-2 gap-x-4 gap-y-1 border-t border-factory-border bg-factory-bg px-3 py-1.5 text-xs md:grid-cols-5">
      <div className="flex items-center gap-2 text-stone-300">
        <Package size={16} className="text-factory-brass" />
        Generated resources {formatRate(totalInputPerMinute)}
      </div>
      <div className="flex items-center gap-2 text-stone-300">
        <Activity size={16} className="text-factory-green" />
        Desired output {formatRate(result.target.targetRatePerMinute)}
      </div>
      <div className="flex items-center gap-2 text-stone-300">
        <Zap size={16} className="text-factory-su" />
        Total {formatSu(result.su.consumedSu)}
      </div>
      <div className="flex items-center gap-2 text-stone-300">
        <Gauge size={16} className="text-factory-copper" />
        Recommended SU {formatSu(result.su.recommendedSu)}
      </div>
      <div className="flex items-center gap-2 text-stone-300">
        <TriangleAlert size={16} className="text-factory-warning" />
        {bottlenecks > 0
          ? `${bottlenecks} bottleneck`
          : tightMachines > 0
            ? `${tightMachines} tight machine`
            : "No bottleneck"}
      </div>
    </footer>
  );
}

import type {
  CalculatorWarning,
  UtilizationStatus,
  WarningSeverity
} from "../types";

export function createWarning(params: {
  id: string;
  severity: WarningSeverity;
  title: string;
  message: string;
  nodeId?: string;
}): CalculatorWarning {
  return params;
}

export function warningForUtilization(params: {
  id: string;
  status: UtilizationStatus;
  utilization: number;
  nodeId: string;
  role?: "machine" | "input_supply" | "target_output";
}): CalculatorWarning | undefined {
  if (
    params.status === "comfortable" ||
    params.status === "tight" ||
    params.status === "exact_target"
  ) {
    return undefined;
  }

  if (params.status === "bottleneck") {
    return createWarning({
      id: params.id,
      severity: "error",
      title: "Bottleneck",
      message: `Required rate is ${(params.utilization * 100).toFixed(1)}% of available capacity. Add machines or lower the target output.`,
      nodeId: params.nodeId
    });
  }

  const isInputSupply = params.role === "input_supply";

  return createWarning({
    id: params.id,
    severity: "warning",
    title: isInputSupply ? "Very tight input supply" : "Very tight machine load",
    message: `Capacity usage is ${(params.utilization * 100).toFixed(1)}%. Add a small buffer if this feeds other machines.`,
    nodeId: params.nodeId
  });
}

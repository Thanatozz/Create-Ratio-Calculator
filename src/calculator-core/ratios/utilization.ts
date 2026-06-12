import type { UtilizationStatus } from "../types";

export function calculateUtilization(
  requiredRatePerMinute: number,
  availableRatePerMinute: number
): number {
  if (availableRatePerMinute <= 0) {
    return Number.POSITIVE_INFINITY;
  }

  return requiredRatePerMinute / availableRatePerMinute;
}

export function getUtilizationStatus(
  utilization: number,
  options: { exactTarget?: boolean } = {}
): UtilizationStatus {
  if (options.exactTarget && Math.abs(utilization - 1) < 0.0001) {
    return "exact_target";
  }

  if (utilization > 1) {
    return "bottleneck";
  }

  if (utilization >= 0.95) {
    return "very_tight";
  }

  if (utilization >= 0.8) {
    return "tight";
  }

  return "comfortable";
}

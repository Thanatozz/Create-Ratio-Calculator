import type { RateUnit, UtilizationStatus } from "../../calculator-core/types";

export function formatNumber(value: number, digits = 2): string {
  if (!Number.isFinite(value)) {
    return "n/a";
  }

  if (Math.abs(value) >= 1000) {
    return value.toLocaleString(undefined, {
      maximumFractionDigits: 0
    });
  }

  return value.toLocaleString(undefined, {
    maximumFractionDigits: digits
  });
}

export function formatRate(value: number): string {
  return `${formatNumber(value)} / min`;
}

export function formatSu(value: number): string {
  return `${formatNumber(value, 0)} SU`;
}

export function formatPercent(value: number): string {
  return `${formatNumber(value * 100, 1)}%`;
}

export function rateUnitLabel(unit: RateUnit): string {
  switch (unit) {
    case "items_per_second":
      return "items/s";
    case "items_per_minute":
      return "items/min";
    case "stacks_per_minute":
      return "stacks/min";
    case "machines":
      return "fixed machines";
    case "machines_per_second":
      return "machines/s";
    case "machines_per_minute":
      return "machines/min";
  }
}

export function utilizationLabel(status: UtilizationStatus): string {
  switch (status) {
    case "comfortable":
      return "Comfortable";
    case "tight":
      return "Tight";
    case "very_tight":
      return "Very tight";
    case "bottleneck":
      return "Bottleneck";
    case "exact_target":
      return "Exact target rate";
  }
}

export function utilizationClass(status: UtilizationStatus): string {
  switch (status) {
    case "comfortable":
      return "text-factory-green";
    case "tight":
      return "text-factory-warning";
    case "very_tight":
      return "text-factory-warning";
    case "bottleneck":
      return "text-factory-danger";
    case "exact_target":
      return "text-factory-brass";
  }
}

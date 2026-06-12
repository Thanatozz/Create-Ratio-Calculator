export function ceilWithMargin(value: number, margin: number): number {
  return Math.ceil(value * (1 + margin));
}

export function roundRate(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function clampMinimum(value: number, minimum: number): number {
  return Math.max(value, minimum);
}

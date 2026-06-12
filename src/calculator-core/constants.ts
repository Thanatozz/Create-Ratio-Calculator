import type { CalculatorMode, RateUnit, RpmPreset, TransportMode } from "./types";

export const TICKS_PER_SECOND = 20;
export const TICKS_PER_MINUTE = 1200;
export const SECONDS_PER_MINUTE = 60;
export const DEFAULT_RPM: RpmPreset = 256;
export const DEFAULT_MODE: CalculatorMode = "realistic";
export const DEFAULT_RATE_UNIT: RateUnit = "items_per_minute";
export const DEFAULT_TRANSPORT_MODE: TransportMode = "brass_funnel";
export const DEFAULT_STACK_SIZE = 64;
export const DEFAULT_REALISTIC_EFFICIENCY = 0.85;
export const DEFAULT_SU_MARGIN = 0.15;
export const DEFAULT_DRILL_SAFETY_MARGIN = 0.1;

export const SUPPORTED_MINECRAFT_VERSION = "1.21.1";
export const SUPPORTED_CREATE_VERSION = "6.x";

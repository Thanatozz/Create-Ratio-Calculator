import type { TransportDefinition, TransportMode } from "../../calculator-core/types";

export const transportModes: Record<TransportMode, TransportDefinition> = {
  none: {
    id: "none",
    name: "None",
    inputDelayTicks: 0,
    notes: "No transport delay."
  },
  direct_throw: {
    id: "direct_throw",
    name: "Direct Throw",
    inputDelayTicks: 27,
    notes: "Conservative thrown stack delay into crushing wheels."
  },
  chute: {
    id: "chute",
    name: "Chute",
    inputDelayTicks: 3
  },
  funnel: {
    id: "funnel",
    name: "Funnel",
    inputDelayTicks: 1
  },
  brass_funnel: {
    id: "brass_funnel",
    name: "Brass Funnel",
    inputDelayTicks: 1
  },
  belt: {
    id: "belt",
    name: "Belt",
    inputDelayTicks: 8,
    notes: "Configurable placeholder for belt insertion timing."
  },
  depot: {
    id: "depot",
    name: "Depot",
    inputDelayTicks: 10
  },
  basin: {
    id: "basin",
    name: "Basin",
    inputDelayTicks: 8
  }
};

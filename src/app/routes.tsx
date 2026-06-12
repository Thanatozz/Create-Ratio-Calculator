import {
  BarChart3,
  Factory,
  Network,
  Settings,
  Zap
} from "lucide-react";
import type { ComponentType } from "react";

export type AppTab =
  | "factory"
  | "visualize"
  | "resources"
  | "su_planner"
  | "settings"
  | "debug";

export interface TabDefinition {
  id: AppTab;
  labelKey: string;
  Icon: ComponentType<{ size?: number; className?: string }>;
}

export const tabs: TabDefinition[] = [
  { id: "factory", labelKey: "navigation.factory", Icon: Factory },
  { id: "visualize", labelKey: "navigation.visualize", Icon: Network },
  { id: "resources", labelKey: "navigation.resources", Icon: BarChart3 },
  { id: "su_planner", labelKey: "navigation.suPlanner", Icon: Zap },
  { id: "settings", labelKey: "navigation.settings", Icon: Settings }
];

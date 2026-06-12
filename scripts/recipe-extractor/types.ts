import type {
  NormalizedRecipe,
  NormalizedTag,
  RecipeSource
} from "../../src/calculator-core/types";

export interface ModFile {
  absolutePath: string;
  fileName: string;
  kind: "archive" | "folder";
}

export interface ArchiveEntry {
  path: string;
  content: Buffer;
}

export interface DetectedModMetadata {
  id: string;
  displayName: string;
  version?: string;
  loader?: RecipeSource["loader"];
  description?: string;
  raw?: unknown;
}

export interface ExtractedSourceData {
  source: RecipeSource;
  warnings: string[];
}

export interface RawRecipeEntry {
  id: string;
  namespace: string;
  path: string;
  raw: unknown;
}

export interface RawTagEntry {
  id: string;
  namespace: string;
  path: string;
  type: "item" | "fluid" | "unknown";
  raw: unknown;
}

export type { NormalizedRecipe, NormalizedTag, RecipeSource };

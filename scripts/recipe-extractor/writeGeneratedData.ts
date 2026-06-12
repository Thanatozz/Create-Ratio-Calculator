import { promises as fs } from "node:fs";
import path from "node:path";
import type {
  RecipeExtractionSummary,
  RecipeSource
} from "../../src/calculator-core/types";

function stableStringify(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function asJsonParseExport(exportName: string, typeName: string, value: unknown): string {
  return `export const ${exportName} = JSON.parse(${JSON.stringify(stableStringify(value))}) as ${typeName};`;
}

export async function writeGeneratedData(params: {
  projectRoot: string;
  sources: RecipeSource[];
  summary: RecipeExtractionSummary;
}): Promise<void> {
  const outputDir = path.join(params.projectRoot, "src", "data", "generated");
  await fs.mkdir(outputDir, { recursive: true });

  await fs.writeFile(
    path.join(outputDir, "recipeSources.generated.ts"),
    `import type { RecipeSource } from "../../calculator-core/types";\n\n${asJsonParseExport("generatedRecipeSources", "RecipeSource[]", params.sources)}\n`,
    "utf8"
  );

  await fs.writeFile(
    path.join(outputDir, "recipeExtractionSummary.generated.ts"),
    `import type { RecipeExtractionSummary } from "../../calculator-core/types";\n\n${asJsonParseExport("recipeExtractionSummary", "RecipeExtractionSummary", params.summary)}\n`,
    "utf8"
  );
}

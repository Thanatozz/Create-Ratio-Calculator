import path from "node:path";
import type { RecipeExtractionSummary, RecipeSource } from "../../src/calculator-core/types";
import { detectModMetadata } from "./detectModMetadata";
import { extractRecipes } from "./extractRecipes";
import { extractTags } from "./extractTags";
import { normalizeRecipe, normalizeTag } from "./normalizeRecipe";
import { readModEntries } from "./readArchive";
import { scanModsFolder } from "./scanModsFolder";
import { writeGeneratedData } from "./writeGeneratedData";

function uniqueSourceId(sourceId: string, usedIds: Set<string>): string {
  let candidate = sourceId || "unknown_source";
  let suffix = 2;
  while (usedIds.has(candidate)) {
    candidate = `${sourceId}_${suffix}`;
    suffix += 1;
  }
  usedIds.add(candidate);
  return candidate;
}

export async function extractRecipeSources(params: {
  projectRoot: string;
  modsFolder?: string;
}): Promise<{ sources: RecipeSource[]; summary: RecipeExtractionSummary }> {
  const modsFolder = params.modsFolder ?? path.join(params.projectRoot, "mods for recipes");
  const relativeModsFolder = path.relative(params.projectRoot, modsFolder) || ".";
  const warnings: string[] = [];
  const modFiles = await scanModsFolder(modsFolder);
  const sources: RecipeSource[] = [];
  const usedIds = new Set<string>();

  for (const modFile of modFiles) {
    try {
      const entries = await readModEntries(modFile);
      const metadata = detectModMetadata(modFile.fileName, entries);
      const sourceId = uniqueSourceId(metadata.id, usedIds);
      const rawRecipes = extractRecipes(entries);
      const rawTags = extractTags(entries);
      const recipes = rawRecipes.map((recipe) => normalizeRecipe(sourceId, recipe));
      const tags = rawTags.map((tag) => normalizeTag(sourceId, tag));
      const supportedRecipeCount = recipes.filter((recipe) => recipe.supported).length;
      const unsupportedRecipeCount = recipes.length - supportedRecipeCount;

      sources.push({
        id: sourceId,
        displayName: metadata.displayName,
        version: metadata.version,
        loader: metadata.loader ?? "unknown",
        fileName: modFile.fileName,
        defaultEnabled: false,
        alwaysEnabled: false,
        recipeCount: recipes.length,
        supportedRecipeCount,
        unsupportedRecipeCount,
        tagCount: tags.length,
        recipes,
        tags,
        metadata: {
          description: metadata.description,
          raw: metadata.raw
        }
      });
    } catch (error) {
      warnings.push(
        `Failed to extract ${modFile.fileName}: ${(error as Error).message}`
      );
    }
  }

  const summary: RecipeExtractionSummary = {
    generatedAt: new Date().toISOString(),
    modsFolder: relativeModsFolder ? `./${relativeModsFolder.replaceAll("\\", "/")}` : ".",
    sourceCount: sources.length,
    totalRecipeCount: sources.reduce((sum, source) => sum + source.recipeCount, 0),
    supportedRecipeCount: sources.reduce(
      (sum, source) => sum + (source.supportedRecipeCount ?? 0),
      0
    ),
    unsupportedRecipeCount: sources.reduce(
      (sum, source) => sum + (source.unsupportedRecipeCount ?? 0),
      0
    ),
    tagCount: sources.reduce((sum, source) => sum + source.tagCount, 0),
    warnings
  };

  await writeGeneratedData({
    projectRoot: params.projectRoot,
    sources,
    summary
  });

  return { sources, summary };
}

import path from "node:path";
import { extractRecipeSources } from "./recipe-extractor/index";

const projectRoot = process.cwd();

extractRecipeSources({
  projectRoot,
  modsFolder: path.join(projectRoot, "mods for recipes")
})
  .then(({ summary }) => {
    console.log(
      `Recipe extraction complete: ${summary.sourceCount} source(s), ${summary.totalRecipeCount} recipe(s), ${summary.tagCount} tag(s).`
    );
    if (summary.warnings.length > 0) {
      for (const warning of summary.warnings) {
        console.warn(warning);
      }
    }
  })
  .catch((error: unknown) => {
    console.warn(
      `Recipe extraction failed; generated fallback data will be used. ${(error as Error).message}`
    );
    process.exitCode = 0;
  });

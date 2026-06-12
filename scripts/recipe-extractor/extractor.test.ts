import { afterEach, describe, expect, it } from "vitest";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import JSZip from "jszip";
import { detectModMetadata } from "./detectModMetadata";
import { extractRecipes } from "./extractRecipes";
import { normalizeRecipe } from "./normalizeRecipe";
import { readModEntries } from "./readArchive";
import { scanModsFolder } from "./scanModsFolder";
import type { ArchiveEntry } from "./types";

const tempDirs: string[] = [];

async function makeTempDir() {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "create-recipes-"));
  tempDirs.push(tempDir);
  return tempDir;
}

function jsonEntry(entryPath: string, value: unknown): ArchiveEntry {
  return {
    path: entryPath,
    content: Buffer.from(JSON.stringify(value), "utf8")
  };
}

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((tempDir) =>
      rm(tempDir, {
        recursive: true,
        force: true
      })
    )
  );
});

describe("recipe extractor", () => {
  it("scans an empty mods folder without crashing", async () => {
    const tempDir = await makeTempDir();

    expect(await scanModsFolder(tempDir)).toEqual([]);
  });

  it("reads recipe, tag, and metadata entries from a mock jar", async () => {
    const tempDir = await makeTempDir();
    const jarPath = path.join(tempDir, "createaddon-1.0.0.jar");
    const zip = new JSZip();
    zip.file(
      "fabric.mod.json",
      JSON.stringify({ id: "createaddon", name: "Create Addon", version: "1.0.0" })
    );
    zip.file(
      "data/createaddon/recipes/crushing/test.json",
      JSON.stringify({ type: "create:crushing", ingredients: [], results: [] })
    );
    zip.file(
      "data/createaddon/tags/items/gears.json",
      JSON.stringify({ values: ["createaddon:gear"] })
    );
    zip.file("com/example/Ignored.class", "not extracted");
    await writeFile(jarPath, await zip.generateAsync({ type: "nodebuffer" }));

    const entries = await readModEntries({
      absolutePath: jarPath,
      fileName: path.basename(jarPath),
      kind: "archive"
    });
    const paths = entries.map((entry) => entry.path);

    expect(paths).toContain("fabric.mod.json");
    expect(paths).toContain("data/createaddon/recipes/crushing/test.json");
    expect(paths).toContain("data/createaddon/tags/items/gears.json");
    expect(paths.some((entryPath) => entryPath.endsWith(".class"))).toBe(false);
  });

  it("extracts recipe JSON from data namespace recipe folders", () => {
    const recipes = extractRecipes([
      jsonEntry("data/create/recipe/milling/wheat.json", {
        type: "create:milling"
      })
    ]);

    expect(recipes).toHaveLength(1);
    expect(recipes[0]).toMatchObject({
      id: "create:milling/wheat",
      namespace: "create",
      path: "milling/wheat"
    });
  });

  it("extracts recipe JSON from data namespace recipes folders", () => {
    const recipes = extractRecipes([
      jsonEntry("data/create/recipes/crushing/cobblestone.json", {
        type: "create:crushing"
      })
    ]);

    expect(recipes).toHaveLength(1);
    expect(recipes[0]).toMatchObject({
      id: "create:crushing/cobblestone",
      namespace: "create",
      path: "crushing/cobblestone"
    });
  });

  it("detects Fabric mod metadata", () => {
    const metadata = detectModMetadata("createaddon.jar", [
      jsonEntry("fabric.mod.json", {
        id: "createaddon",
        name: "Create Addon",
        version: "1.0.0",
        description: "Addon recipes"
      })
    ]);

    expect(metadata).toMatchObject({
      id: "createaddon",
      displayName: "Create Addon",
      version: "1.0.0",
      loader: "fabric"
    });
  });

  it.each([
    ["META-INF/mods.toml", "forge"],
    ["META-INF/neoforge.mods.toml", "neoforge"]
  ])("detects %s mod metadata", (entryPath, loader) => {
    const metadata = detectModMetadata("createaddition-1.21.1.jar", [
      {
        path: entryPath,
        content: Buffer.from(
          [
            'modId="createaddition"',
            'displayName="Create Crafts & Additions"',
            'version="1.21.1-2.0.0"',
            'description="More Create power options"'
          ].join("\n"),
          "utf8"
        )
      }
    ]);

    expect(metadata).toMatchObject({
      id: "createaddition",
      displayName: "Create Crafts & Additions",
      version: "1.21.1-2.0.0",
      loader
    });
  });

  it("normalizes a Create crushing recipe", () => {
    const recipe = normalizeRecipe("addon", {
      id: "create:crushing/cobblestone",
      namespace: "create",
      path: "crushing/cobblestone",
      raw: {
        type: "create:crushing",
        ingredients: [{ item: "minecraft:cobblestone" }],
        results: [{ id: "minecraft:gravel", count: 1 }],
        processingTime: 250
      }
    });

    expect(recipe.supported).toBe(true);
    expect(recipe.machineId).toBe("create:crushing_wheel_pair");
    expect(recipe.processingTimeTicks).toBe(250);
    expect(recipe.inputs[0]).toMatchObject({ itemId: "minecraft:cobblestone" });
    expect(recipe.outputs[0]).toMatchObject({ itemId: "minecraft:gravel" });
  });

  it("normalizes output chance", () => {
    const recipe = normalizeRecipe("addon", {
      id: "create:crushing/gravel",
      namespace: "create",
      path: "crushing/gravel",
      raw: {
        type: "create:crushing",
        ingredients: [{ item: "minecraft:gravel" }],
        results: [{ item: "minecraft:flint", count: 1, chance: 0.25 }]
      }
    });

    expect(recipe.outputs[0]).toMatchObject({
      itemId: "minecraft:flint",
      chance: 0.25
    });
  });

  it("normalizes tag inputs", () => {
    const recipe = normalizeRecipe("addon", {
      id: "create:pressing/iron_sheet",
      namespace: "create",
      path: "pressing/iron_sheet",
      raw: {
        type: "create:pressing",
        ingredients: [{ tag: "c:ingots/iron" }],
        results: [{ item: "create:iron_sheet" }]
      }
    });

    expect(recipe.inputs[0]).toMatchObject({ tag: "c:ingots/iron" });
  });

  it("normalizes nested item ids, fluids, and conditions", () => {
    const recipe = normalizeRecipe("addon", {
      id: "addon:mixing/test",
      namespace: "addon",
      path: "mixing/test",
      raw: {
        type: "create:mixing",
        "neoforge:conditions": [{ type: "neoforge:mod_loaded", modid: "create" }],
        ingredients: [
          { item: { id: "minecraft:copper_ingot" } },
          { fluid: { id: "minecraft:water" }, amount: 1000 }
        ],
        results: [
          { item: { id: "addon:wet_copper" }, count: 2 },
          { fluid: "minecraft:lava", amount: 250 }
        ],
        processing_time: 80
      }
    });

    expect(recipe.inputs[0]).toMatchObject({ itemId: "minecraft:copper_ingot" });
    expect(recipe.outputs[0]).toMatchObject({
      itemId: "addon:wet_copper",
      count: 2
    });
    expect(recipe.fluidInputs?.[0]).toMatchObject({
      fluidId: "minecraft:water",
      amountMb: 1000
    });
    expect(recipe.fluidOutputs?.[0]).toMatchObject({
      fluidId: "minecraft:lava",
      amountMb: 250
    });
    expect(recipe.conditions?.[0]).toMatchObject({ type: "neoforge:mod_loaded" });
    expect(recipe.processingTimeTicks).toBe(80);
  });

  it("reads extracted folders as recipe sources", async () => {
    const tempDir = await makeTempDir();
    const modFolder = path.join(tempDir, "folder-addon");
    await mkdir(path.join(modFolder, "data", "folderaddon", "recipes"), {
      recursive: true
    });
    await writeFile(
      path.join(modFolder, "data", "folderaddon", "recipes", "test.json"),
      JSON.stringify({ type: "create:milling" })
    );

    const entries = await readModEntries({
      absolutePath: modFolder,
      fileName: "folder-addon",
      kind: "folder"
    });

    expect(entries.map((entry) => entry.path)).toContain(
      "data/folderaddon/recipes/test.json"
    );
  });
});

import { describe, expect, it } from "vitest";
import {
  cleanGeneratedRecipeName,
  cleanSourceDisplayName,
  formatItemDisplayName,
  formatRecipeDisplayName,
  humanizeSourceId,
  isMandatoryText,
  normalizeRecipeId
} from "../components/ui/displayName";

describe("formatItemDisplayName", () => {
  it("uses curated Create base names", () => {
    expect(formatItemDisplayName("minecraft:cobblestone")).toBe("Cobblestone");
    expect(formatItemDisplayName("create:andesite_alloy")).toBe("Andesite Alloy");
  });

  it("humanises unknown namespaced ids", () => {
    expect(formatItemDisplayName("create:crushed_raw_iron")).toBe("Crushed Raw Iron");
    expect(formatItemDisplayName("createcasing:zinc_shaft")).toBe("Zinc Shaft");
  });

  it("strips version suffixes", () => {
    expect(formatItemDisplayName("create:gravel:1.21.1")).toBe("Gravel");
  });

  it("never returns raw namespaced ids", () => {
    const result = formatItemDisplayName("createaddition:some_widget");
    expect(result).not.toContain(":");
    expect(result).toBe("Some Widget");
  });
});

describe("normalizeRecipeId", () => {
  it("keeps the raw id intact while extracting metadata", () => {
    const normalized = normalizeRecipeId("create:crushing/cobblestone");
    expect(normalized.raw).toBe("create:crushing/cobblestone");
    expect(normalized.namespace).toBe("create");
    expect(normalized.process).toBe("crushing");
  });

  it("parses malformed synthetic ids with arrows and versions", () => {
    const normalized = normalizeRecipeId("create:dragonplus:andesite-->gravel:1.21.1");
    expect(normalized.inputHint).toBe("Andesite");
    expect(normalized.outputHint).toBe("Gravel");
  });
});

describe("cleanGeneratedRecipeName", () => {
  it("cleans ugly generated ids with arrows and version suffixes", () => {
    const result = cleanGeneratedRecipeName("create:dragonplus:andesite-->gravel:1.21.1");
    expect(result).not.toContain("-->");
    expect(result).not.toContain(":1.21.1");
    expect(result).toContain("Andesite");
    expect(result).toContain("Gravel");
  });

  it("produces a clean fallback for plain ids", () => {
    expect(cleanGeneratedRecipeName("create:milling/wheat")).toBe("Milling: Wheat");
  });

  it("never returns empty for non-empty input", () => {
    expect(cleanGeneratedRecipeName("garbage")).not.toBe("");
  });
});

describe("formatRecipeDisplayName", () => {
  it("formats input and output flows with a process prefix", () => {
    const label = formatRecipeDisplayName({
      id: "create:crushing/cobblestone",
      type: "create:crushing",
      input: [{ itemId: "minecraft:cobblestone" }],
      outputs: [{ itemId: "minecraft:gravel" }]
    });
    expect(label).toBe("Crushing: Cobblestone → Gravel");
  });

  it("formats a flow without a known process", () => {
    const label = formatRecipeDisplayName({
      id: "addon:unknown/thing",
      type: "addon:unknown",
      input: [{ itemId: "minecraft:cobblestone" }],
      outputs: [{ itemId: "minecraft:gravel" }]
    });
    expect(label).toBe("Cobblestone → Gravel");
  });

  it("falls back to a clean id when no inputs/outputs are present", () => {
    const label = formatRecipeDisplayName({ id: "create:milling/wheat" });
    expect(label).not.toContain("create:");
    expect(label).not.toContain("/");
    expect(label).toBe("Milling: Wheat");
  });
});

describe("humanizeSourceId", () => {
  it("maps the base source and humanises addon ids", () => {
    expect(humanizeSourceId("create_base")).toBe("Create Base");
    expect(humanizeSourceId("createcasing")).toBe("Createcasing");
  });
});

describe("cleanSourceDisplayName", () => {
  it("strips stray quotes and #mandatory markers", () => {
    expect(cleanSourceDisplayName('Create: Blocks & Bogies" #mandatory')).toBe(
      "Create: Blocks & Bogies"
    );
    expect(cleanSourceDisplayName("Create")).toBe("Create");
    expect(cleanSourceDisplayName('Create: Factory" #mandatory')).toBe(
      "Create: Factory"
    );
  });
});

describe("isMandatoryText", () => {
  it("detects the mandatory dependency marker", () => {
    expect(isMandatoryText('1.0.7" #mandatory')).toBe(true);
    expect(isMandatoryText("Create Encased")).toBe(false);
    expect(isMandatoryText(undefined)).toBe(false);
  });
});

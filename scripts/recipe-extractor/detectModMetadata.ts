import path from "node:path";
import type { ArchiveEntry, DetectedModMetadata } from "./types";

function sanitizeId(value: string): string {
  return value
    .replace(/\.(jar|zip)$/i, "")
    .replace(/[-_]?(\d+\.)+\d+.*$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function stripQuotes(value: string): string {
  return value.trim().replace(/^["']|["']$/g, "");
}

function extractTomlValue(content: string, key: string): string | undefined {
  const match = content.match(new RegExp(`^\\s*${key}\\s*=\\s*(.+)$`, "m"));
  return match ? stripQuotes(match[1]) : undefined;
}

export function detectModMetadata(
  fileName: string,
  entries: ArchiveEntry[]
): DetectedModMetadata {
  const fallbackId = sanitizeId(fileName) || "unknown_source";
  const fallbackDisplayName = path.parse(fileName).name;
  const fabric = entries.find((entry) => entry.path === "fabric.mod.json");

  if (fabric) {
    try {
      const raw = JSON.parse(fabric.content.toString("utf8")) as {
        id?: string;
        name?: string;
        version?: string;
        description?: string;
      };
      return {
        id: sanitizeId(raw.id ?? fallbackId),
        displayName: raw.name ?? raw.id ?? fallbackDisplayName,
        version: raw.version,
        loader: "fabric",
        description: raw.description,
        raw
      };
    } catch {
      return {
        id: fallbackId,
        displayName: fallbackDisplayName,
        loader: "fabric"
      };
    }
  }

  const toml = entries.find(
    (entry) =>
      entry.path === "META-INF/mods.toml" ||
      entry.path === "META-INF/neoforge.mods.toml"
  );

  if (toml) {
    const content = toml.content.toString("utf8");
    const modId = extractTomlValue(content, "modId");
    const displayName = extractTomlValue(content, "displayName");
    const version = extractTomlValue(content, "version");
    const description = extractTomlValue(content, "description");

    return {
      id: sanitizeId(modId ?? fallbackId),
      displayName: displayName ?? modId ?? fallbackDisplayName,
      version,
      loader: toml.path.includes("neoforge") ? "neoforge" : "forge",
      description,
      raw: content
    };
  }

  const pack = entries.find((entry) => entry.path === "pack.mcmeta");
  if (pack) {
    try {
      const raw = JSON.parse(pack.content.toString("utf8")) as {
        pack?: { description?: string; pack_format?: number };
      };
      return {
        id: fallbackId,
        displayName: raw.pack?.description ?? fallbackDisplayName,
        loader: "datapack",
        description: raw.pack?.description,
        raw
      };
    } catch {
      return {
        id: fallbackId,
        displayName: fallbackDisplayName,
        loader: "datapack"
      };
    }
  }

  return {
    id: fallbackId,
    displayName: fallbackDisplayName,
    loader: "unknown"
  };
}

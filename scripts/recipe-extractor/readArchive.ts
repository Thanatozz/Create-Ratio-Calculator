import { promises as fs } from "node:fs";
import path from "node:path";
import JSZip from "jszip";
import type { ArchiveEntry, ModFile } from "./types";

const wantedPathPattern =
  /(^|\/)(fabric\.mod\.json|pack\.mcmeta|META-INF\/mods\.toml|META-INF\/neoforge\.mods\.toml)$|^data\/.+\/(recipe|recipes|tags)\/.+\.json$/;

function normalizePath(entryPath: string): string {
  return entryPath.replaceAll("\\", "/").replace(/^\/+/, "");
}

async function readFolderEntries(root: string, current = root): Promise<ArchiveEntry[]> {
  const entries = await fs.readdir(current, { withFileTypes: true });
  const result: ArchiveEntry[] = [];

  for (const entry of entries) {
    const absolutePath = path.join(current, entry.name);
    if (entry.isDirectory()) {
      result.push(...(await readFolderEntries(root, absolutePath)));
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const relativePath = normalizePath(path.relative(root, absolutePath));
    if (wantedPathPattern.test(relativePath)) {
      result.push({
        path: relativePath,
        content: await fs.readFile(absolutePath)
      });
    }
  }

  return result;
}

export async function readModEntries(modFile: ModFile): Promise<ArchiveEntry[]> {
  if (modFile.kind === "folder") {
    return readFolderEntries(modFile.absolutePath);
  }

  const archive = await JSZip.loadAsync(await fs.readFile(modFile.absolutePath));
  const result: ArchiveEntry[] = [];

  for (const entry of Object.values(archive.files)) {
    const normalizedPath = normalizePath(entry.name);
    if (entry.dir || !wantedPathPattern.test(normalizedPath)) {
      continue;
    }

    result.push({
      path: normalizedPath,
      content: await entry.async("nodebuffer")
    });
  }

  return result;
}

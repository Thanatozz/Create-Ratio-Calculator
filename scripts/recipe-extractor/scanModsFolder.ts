import { promises as fs } from "node:fs";
import path from "node:path";
import type { ModFile } from "./types";

export async function scanModsFolder(modsFolder: string): Promise<ModFile[]> {
  try {
    const entries = await fs.readdir(modsFolder, { withFileTypes: true });
    const modFiles: ModFile[] = [];

    for (const entry of entries) {
      const absolutePath = path.join(modsFolder, entry.name);
      const lowerName = entry.name.toLowerCase();

      if (entry.isDirectory()) {
        modFiles.push({
          absolutePath,
          fileName: entry.name,
          kind: "folder"
        });
        continue;
      }

      if (
        entry.isFile() &&
        (lowerName.endsWith(".jar") || lowerName.endsWith(".zip"))
      ) {
        modFiles.push({
          absolutePath,
          fileName: entry.name,
          kind: "archive"
        });
      }
    }

    return modFiles.sort((a, b) => a.fileName.localeCompare(b.fileName));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

import type { ArchiveEntry, RawTagEntry } from "./types";

const tagPathPattern = /^data\/([^/]+)\/tags\/(.+)\.json$/;

function tagTypeFromPath(path: string): RawTagEntry["type"] {
  if (path.startsWith("items/")) {
    return "item";
  }
  if (path.startsWith("fluids/")) {
    return "fluid";
  }
  return "unknown";
}

export function extractTags(entries: ArchiveEntry[]): RawTagEntry[] {
  const tags: RawTagEntry[] = [];

  for (const entry of entries) {
    const match = entry.path.match(tagPathPattern);
    if (!match) {
      continue;
    }

    try {
      const namespace = match[1];
      const tagPath = match[2];
      tags.push({
        id: `${namespace}:${tagPath.replace(/^(items|fluids)\//, "")}`,
        namespace,
        path: tagPath,
        type: tagTypeFromPath(tagPath),
        raw: JSON.parse(entry.content.toString("utf8"))
      });
    } catch {
      // Invalid tags are ignored, matching recipe handling.
    }
  }

  return tags;
}

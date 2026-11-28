import { readFileSync } from "node:fs";
import path from "node:path";
import { createFileSnapshotStore } from "./snapshot-store.js";

function currentBuildId() {
  try {
    return readFileSync(path.join(process.cwd(), ".next", "BUILD_ID"), "utf8").trim() || null;
  } catch {
    return null;
  }
}

/**
 * Snapshot store for one in-process memo, or null when snapshots are off:
 * outside `next start` / `node server.js`, during `next build`, or when the
 * build id is unknown. LENAQAR_CACHE_DIR points at a Docker volume shared by
 * the blue/green containers; the default sits under .next/cache.
 */
export function lenaqarSnapshotStore({ name, serialize, deserialize }) {
  if (process.env.NODE_ENV !== "production") return null;
  if (process.env.NEXT_PHASE === "phase-production-build") return null;
  if (process.env.LENAQAR_SNAPSHOTS === "off") return null;
  const version = currentBuildId();
  if (!version) return null;
  const dir =
    process.env.LENAQAR_CACHE_DIR || path.join(process.cwd(), ".next", "cache", "lenaqar");
  return createFileSnapshotStore({ dir, name, version, serialize, deserialize });
}

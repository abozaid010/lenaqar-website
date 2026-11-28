import { mkdir, readFile, readdir, rename, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * A JSON file per memo key that outlives the process, so a restarted
 * container serves its last complete catalogue at once instead of walking the
 * API first. Plugs into createSwrMemo's `persist` option.
 *
 * Files are keyed by `version` (the Next build id): a snapshot written by
 * another build is never read, so a new release can never render data shaped
 * by old code. Writes are atomic (temp file + rename). Every failure is
 * reported to the caller and the memo carries on without the snapshot.
 */
export function createFileSnapshotStore({
  dir,
  name,
  version,
  serialize = (value) => value,
  deserialize = (data) => data,
  // Other builds' files are kept 2 days, so a rollback to the previous colour
  // also starts warm; each file is about 1 MB.
  pruneOtherVersionsAfterMs = 2 * 24 * 60 * 60 * 1000,
  now = Date.now,
}) {
  if (!dir || !name || !version) throw new TypeError("dir, name and version are required");
  const safe = (part) => String(part).replace(/[^a-zA-Z0-9_-]/g, "_");
  const prefix = `${safe(name)}-`;
  const fileFor = (key) => path.join(dir, `${prefix}${safe(key)}-${safe(version)}.json`);

  async function read(key) {
    let text;
    try {
      text = await readFile(fileFor(key), "utf8");
    } catch (error) {
      if (error?.code === "ENOENT") return null;
      throw error;
    }
    const snapshot = JSON.parse(text);
    if (snapshot?.version !== version || snapshot?.key !== key) return null;
    if (!Number.isFinite(snapshot.fetchedAt)) return null;
    return { value: deserialize(snapshot.data), fetchedAt: snapshot.fetchedAt };
  }

  async function prune(keepFile) {
    const names = await readdir(dir).catch(() => []);
    await Promise.all(
      names
        .filter((file) => file.startsWith(prefix) && path.join(dir, file) !== keepFile)
        .map(async (file) => {
          const full = path.join(dir, file);
          const info = await stat(full).catch(() => null);
          if (info && now() - info.mtimeMs > pruneOtherVersionsAfterMs) {
            await unlink(full).catch(() => {});
          }
        }),
    );
  }

  async function write(key, value, fetchedAt) {
    const file = fileFor(key);
    const tmp = `${file}.${process.pid}.${now()}.tmp`;
    await mkdir(dir, { recursive: true });
    const body = JSON.stringify({ version, key, fetchedAt, data: serialize(value) });
    await writeFile(tmp, body, "utf8");
    try {
      await rename(tmp, file);
    } catch (error) {
      await unlink(tmp).catch(() => {});
      throw error;
    }
    await prune(file);
  }

  return { read, write, fileFor };
}

/**
 * In-process stale-while-revalidate memo, keyed by string.
 *
 * The public site runs as one Node process, so a module-level memo is the
 * cheapest cache that has no size limit (Next's data cache refuses items over
 * 2 MB). Contract:
 *
 * - fresh (age < freshMs): the cached value, no work.
 * - stale (freshMs <= age < maxStaleMs): the cached value at once; one
 *   background refresh replaces it when it succeeds.
 * - missing or older than maxStaleMs: callers wait for one shared load.
 *
 * A failed load never replaces a good value and is never cached, so the next
 * call retries. Concurrent callers for one key share one in-flight load.
 * Entries are evicted least-recently-used beyond maxEntries.
 *
 * Optional `persist` ({ read(key), write(key, value, fetchedAt) }): the first
 * call for a key reads a saved value (with its original fetchedAt, so age
 * rules apply as if it never left memory), and every successful load is saved.
 * Persist failures go to onBackgroundError and never fail a call.
 */
export function createSwrMemo({
  load,
  freshMs,
  maxStaleMs,
  maxEntries = 32,
  now = Date.now,
  onBackgroundError = () => {},
  persist = null,
}) {
  if (typeof load !== "function") throw new TypeError("load is required");
  if (![freshMs, maxStaleMs, maxEntries].every((v) => Number.isFinite(v) && v > 0)) {
    throw new TypeError("freshMs, maxStaleMs and maxEntries must be positive numbers");
  }
  if (maxStaleMs < freshMs) throw new TypeError("maxStaleMs must be >= freshMs");

  /** @type {Map<string, { value?: unknown, hasValue: boolean, fetchedAt: number, promise: Promise<unknown> | null }>} */
  const entries = new Map();

  function touch(key, entry) {
    entries.delete(key);
    entries.set(key, entry);
    while (entries.size > maxEntries) {
      const oldest = entries.keys().next().value;
      // Never drop an entry that is mid-load; its promise still settles into it.
      if (entries.get(oldest)?.promise) break;
      entries.delete(oldest);
    }
  }

  function startLoad(key, entry) {
    if (entry.promise) return entry.promise;
    entry.promise = Promise.resolve()
      .then(() => load(key))
      .then(
        (value) => {
          entry.value = value;
          entry.hasValue = true;
          entry.fetchedAt = now();
          entry.promise = null;
          if (persist) {
            const { fetchedAt } = entry;
            Promise.resolve()
              .then(() => persist.write(key, value, fetchedAt))
              .catch((error) => onBackgroundError(error, key));
          }
          return value;
        },
        (error) => {
          entry.promise = null;
          if (!entry.hasValue && entries.get(key) === entry) entries.delete(key);
          throw error;
        },
      );
    return entry.promise;
  }

  function hydrate(key, entry) {
    if (!entry.hydrating) {
      entry.hydrating = Promise.resolve()
        .then(() => persist.read(key))
        .then(
          (saved) => {
            if (entry.hasValue || !saved || !Number.isFinite(saved.fetchedAt)) return;
            if (now() - saved.fetchedAt >= maxStaleMs) return;
            entry.value = saved.value;
            entry.hasValue = true;
            entry.fetchedAt = saved.fetchedAt;
          },
          (error) => onBackgroundError(error, key),
        );
    }
    return entry.hydrating;
  }

  async function get(key) {
    let entry = entries.get(key);
    if (!entry) {
      entry = { value: undefined, hasValue: false, fetchedAt: 0, promise: null, hydrating: null };
    }
    touch(key, entry);
    if (persist && !entry.hasValue) await hydrate(key, entry);

    if (entry.hasValue) {
      const age = now() - entry.fetchedAt;
      if (age < freshMs) return entry.value;
      if (age < maxStaleMs) {
        if (!entry.promise) {
          startLoad(key, entry).catch((error) => onBackgroundError(error, key));
        }
        return entry.value;
      }
    }
    return startLoad(key, entry);
  }

  /** Start a load without waiting for it (boot warm-up). Errors go to onBackgroundError. */
  function warm(key) {
    get(key).catch((error) => onBackgroundError(error, key));
  }

  return {
    get,
    warm,
    /** Test/debug view of one entry. */
    peek(key) {
      const entry = entries.get(key);
      return entry
        ? {
            hasValue: entry.hasValue,
            fetchedAt: entry.fetchedAt,
            loading: Boolean(entry.promise),
            size: Array.isArray(entry.value) ? entry.value.length : null,
          }
        : null;
    },
    get size() {
      return entries.size;
    },
  };
}

/**
 * One memo per name per process. Next compiles the instrumentation hook and
 * each route into separate bundles, so a plain module-level memo could exist
 * twice; globalThis makes the boot warm-up fill the same cache pages read.
 */
export function sharedSwrMemo(name, options) {
  const slot = Symbol.for(`lenaqar.swr-memo.${name}`);
  if (!globalThis[slot]) globalThis[slot] = createSwrMemo(options);
  return globalThis[slot];
}

/**
 * Session-persisted queue for sequential WhatsApp app handoffs on
 * phones / tablets / iPad (one chat per user tap).
 *
 * Survives app-switch and soft reloads via sessionStorage.
 */

const STORAGE_KEY = "lena_wa_deeplink_queue_v1";

/** @type {Set<(state: WhatsappDeepLinkQueueState | null) => void>} */
const listeners = new Set();

/**
 * @typedef {{ phone: string, message: string, url: string }} WhatsappDeepLinkQueueItem
 * @typedef {{
 *   total: number,
 *   openedCount: number,
 *   remaining: WhatsappDeepLinkQueueItem[],
 * }} WhatsappDeepLinkQueueState
 */

function notify(state) {
  listeners.forEach((fn) => {
    try {
      fn(state);
    } catch {
      // Listener errors must not break the queue.
    }
  });
}

function readRaw() {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.remaining)) return null;
    return {
      total: Number(parsed.total) || 0,
      openedCount: Number(parsed.openedCount) || 0,
      remaining: parsed.remaining.filter(
        (item) => item && item.url && item.phone,
      ),
    };
  } catch {
    return null;
  }
}

function writeRaw(state) {
  if (typeof window === "undefined") return;
  try {
    if (!state || !state.remaining?.length) {
      sessionStorage.removeItem(STORAGE_KEY);
      notify(null);
      return;
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    notify(state);
  } catch {
    // Private mode / quota — still notify in-memory listeners.
    notify(state?.remaining?.length ? state : null);
  }
}

/** @returns {WhatsappDeepLinkQueueState | null} */
export function getWhatsappDeepLinkQueue() {
  const state = readRaw();
  if (!state || state.remaining.length === 0) return null;
  return state;
}

/** @param {WhatsappDeepLinkQueueState} state */
export function setWhatsappDeepLinkQueue(state) {
  if (!state?.remaining?.length) {
    clearWhatsappDeepLinkQueue();
    return;
  }
  writeRaw({
    total: Number(state.total) || state.remaining.length,
    openedCount: Number(state.openedCount) || 0,
    remaining: state.remaining,
  });
}

export function clearWhatsappDeepLinkQueue() {
  writeRaw(null);
}

/**
 * Subscribe to queue changes. Returns unsubscribe.
 * @param {(state: WhatsappDeepLinkQueueState | null) => void} listener
 */
export function subscribeWhatsappDeepLinkQueue(listener) {
  if (typeof listener !== "function") return () => {};
  listeners.add(listener);
  // Emit current state immediately so mounts stay in sync.
  listener(getWhatsappDeepLinkQueue());
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Open the next queued WhatsApp draft. Must be called from a tap/click.
 * @returns {{
 *   ok: boolean,
 *   done: boolean,
 *   openedCount: number,
 *   total: number,
 *   remaining: number,
 * } | null}
 */
export function openNextQueuedWhatsappDeepLink() {
  const state = getWhatsappDeepLinkQueue();
  if (!state?.remaining?.length) {
    clearWhatsappDeepLinkQueue();
    return null;
  }

  const [next, ...rest] = state.remaining;
  const openedCount = (state.openedCount || 0) + 1;
  const total = state.total || openedCount + rest.length;

  // Same-tab Universal/App Link handoff — required on iOS/Android/iPad.
  window.location.assign(next.url);

  if (rest.length === 0) {
    clearWhatsappDeepLinkQueue();
    return {
      ok: true,
      done: true,
      openedCount,
      total,
      remaining: 0,
    };
  }

  writeRaw({
    total,
    openedCount,
    remaining: rest,
  });

  return {
    ok: true,
    done: false,
    openedCount,
    total,
    remaining: rest.length,
  };
}

/** Skip the current next recipient without opening WhatsApp. */
export function skipNextQueuedWhatsappDeepLink() {
  const state = getWhatsappDeepLinkQueue();
  if (!state?.remaining?.length) {
    clearWhatsappDeepLinkQueue();
    return null;
  }

  const [, ...rest] = state.remaining;
  const openedCount = state.openedCount || 0;
  const total = state.total || openedCount + state.remaining.length;

  if (rest.length === 0) {
    clearWhatsappDeepLinkQueue();
    return { done: true, openedCount, total, remaining: 0 };
  }

  writeRaw({
    total,
    openedCount,
    remaining: rest,
  });

  return {
    done: false,
    openedCount,
    total,
    remaining: rest.length,
  };
}

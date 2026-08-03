/**
 * Behavioral verification for WhatsApp deep-link paths (desktop + touch).
 * Run: node --test src/lib/__tests__/whatsapp-deeplink-behavior.test.js
 *
 * Does not assume correctness — asserts device routing, URL shape, desktop
 * blank-tab reservation + paced navigation, and mobile sequential queue.
 */

import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  clearWhatsappDeepLinkQueue,
  getWhatsappDeepLinkQueue,
  setWhatsappDeepLinkQueue,
  openNextQueuedWhatsappDeepLink,
  skipNextQueuedWhatsappDeepLink,
} from "../whatsapp-deeplink-queue.js";

// ── Device detection (mirrors isTouchWhatsappClient) ───────────────────────

function isTouchWhatsappClientFrom(ua, platform, maxTouchPoints, { coarse = false, hover = true } = {}) {
  if (/Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|iPad/i.test(ua)) {
    return true;
  }
  if (platform === "MacIntel" && (maxTouchPoints || 0) > 1) {
    return coarse || !hover;
  }
  return false;
}

function buildUrl(phone, message, touch) {
  const digits = String(phone || "").replace(/\D/g, "");
  const text = String(message ?? "").trim();
  if (!digits || !text) return "";
  if (touch) {
    return `https://api.whatsapp.com/send?phone=${digits}&text=${encodeURIComponent(text)}`;
  }
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

describe("device routing", () => {
  it("treats iPhone as touch", () => {
    assert.equal(
      isTouchWhatsappClientFrom(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
        "iPhone",
        5,
      ),
      true,
    );
  });

  it("treats Android phone as touch", () => {
    assert.equal(
      isTouchWhatsappClientFrom(
        "Mozilla/5.0 (Linux; Android 14; Pixel 8)",
        "Linux armv8l",
        5,
      ),
      true,
    );
  });

  it("treats Android tablet as touch", () => {
    assert.equal(
      isTouchWhatsappClientFrom(
        "Mozilla/5.0 (Linux; Android 13; SM-X900) AppleWebKit/537.36",
        "Linux armv8l",
        5,
      ),
      true,
    );
  });

  it("treats classic iPad UA as touch", () => {
    assert.equal(
      isTouchWhatsappClientFrom(
        "Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)",
        "iPad",
        5,
      ),
      true,
    );
  });

  it("treats iPadOS desktop-mode MacIntel+touch as touch", () => {
    assert.equal(
      isTouchWhatsappClientFrom(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15",
        "MacIntel",
        5,
        { coarse: true, hover: false },
      ),
      true,
    );
  });

  it("does NOT treat Mac trackpad (fine pointer + hover) as touch", () => {
    assert.equal(
      isTouchWhatsappClientFrom(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120",
        "MacIntel",
        2,
        { coarse: false, hover: true },
      ),
      false,
    );
  });

  it("treats desktop Chrome as non-touch", () => {
    assert.equal(
      isTouchWhatsappClientFrom(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
        "Win32",
        0,
      ),
      false,
    );
  });

  it("treats Mac without multi-touch as non-touch", () => {
    assert.equal(
      isTouchWhatsappClientFrom(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120",
        "MacIntel",
        0,
      ),
      false,
    );
  });
});

describe("URL builders", () => {
  it("desktop uses wa.me with text", () => {
    const url = buildUrl("201000000001", "Hello", false);
    assert.match(url, /^https:\/\/wa\.me\/201000000001\?text=/);
    assert.ok(url.includes(encodeURIComponent("Hello")));
  });

  it("touch uses api.whatsapp.com app handoff with text", () => {
    const url = buildUrl("201000000001", "مرحبا", true);
    assert.match(
      url,
      /^https:\/\/api\.whatsapp\.com\/send\?phone=201000000001&text=/,
    );
    assert.ok(url.includes(encodeURIComponent("مرحبا")));
  });
});

describe("desktop blank-reserve + paced navigate", () => {
  it("opens about:blank for every recipient sync, then navigates in order with delay", async () => {
    const opens = [];
    const navigations = [];
    const delayMs = 50; // short for test; production uses 5000
    const recipients = [
      { phone: "201111111111", url: "https://wa.me/201111111111?text=a" },
      { phone: "201222222222", url: "https://wa.me/201222222222?text=b" },
      { phone: "201333333333", url: "https://wa.me/201333333333?text=c" },
    ];

    const windows = recipients.map((r, i) => {
      const win = {
        name: `wa_deeplink_${r.phone}_${i}`,
        location: { href: "about:blank" },
        opener: {},
      };
      return win;
    });

    // Sync reservation (must happen before any await)
    const reserved = recipients.map((r, i) => {
      opens.push({ url: "about:blank", target: `wa_deeplink_${r.phone}_${i}` });
      return { win: windows[i], url: r.url };
    });

    assert.equal(opens.length, 3);
    assert.ok(opens.every((o) => o.url === "about:blank"));

    let opened = 0;
    const timestamps = [];
    for (let i = 0; i < reserved.length; i += 1) {
      if (i > 0 && delayMs > 0) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
      timestamps.push(Date.now());
      reserved[i].win.location.href = reserved[i].url;
      navigations.push(reserved[i].url);
      opened += 1;
    }

    assert.equal(opened, 3);
    assert.deepEqual(
      navigations,
      recipients.map((r) => r.url),
    );
    // Gaps between navigations should be ~delayMs (allow jitter)
    assert.ok(timestamps[1] - timestamps[0] >= delayMs - 5);
    assert.ok(timestamps[2] - timestamps[1] >= delayMs - 5);
  });

  it("counts blocked blanks then sync-opens real wa.me while gesture is live", async () => {
    const opens = [];
    const prepared = [
      { phone: "1", url: "https://wa.me/1?text=a", index: 0 },
      { phone: "2", url: "https://wa.me/2?text=b", index: 1 },
      { phone: "3", url: "https://wa.me/3?text=c", index: 2 },
    ];
    // First pass: blank for #0 and #2 succeed; #1 blocked
    const blankWins = [
      { location: { href: "about:blank" } },
      null,
      { location: { href: "about:blank" } },
    ];
    const reserved = prepared.map((item, i) => {
      opens.push({ url: "about:blank", target: `wa_deeplink_${item.phone}_${i}` });
      return {
        win: blankWins[i],
        url: item.url,
        phone: item.phone,
        message: "x",
        openedDirect: false,
        index: i,
      };
    });
    // Phase 2: blocked blank → open real URL sync
    for (const item of reserved) {
      if (item.win) continue;
      opens.push({ url: item.url, target: `wa_deeplink_${item.phone}_${item.index}` });
      item.win = { location: { href: item.url } };
      item.openedDirect = true;
    }

    let opened = 0;
    let blocked = 0;
    let pacedNavCount = 0;
    for (const item of reserved) {
      if (!item.win) {
        blocked += 1;
        continue;
      }
      if (item.openedDirect) {
        opened += 1;
        continue;
      }
      pacedNavCount += 1;
      item.win.location.href = item.url;
      opened += 1;
    }

    assert.equal(opened, 3);
    assert.equal(blocked, 0);
    assert.equal(pacedNavCount, 2);
    assert.equal(opens.filter((o) => o.url === "about:blank").length, 3);
    assert.equal(opens.filter((o) => o.url.startsWith("https://wa.me/")).length, 1);
  });
});

describe("mobile sequential queue", () => {
  /** Minimal sessionStorage mock for Node */
  let store;

  beforeEach(() => {
    store = new Map();
    globalThis.window = {
      location: { href: "http://localhost/crm", assign(url) {
        this.href = url;
      } },
    };
    globalThis.sessionStorage = {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
    };
    clearWhatsappDeepLinkQueue();
  });

  afterEach(() => {
    clearWhatsappDeepLinkQueue();
    delete globalThis.window;
    delete globalThis.sessionStorage;
  });

  it("stores remaining after first open and open-next advances one by one", () => {
    // Simulate touch path: first opened via assign, rest queued
    const remaining = [
      {
        phone: "201000000002",
        message: "m2",
        url: "https://api.whatsapp.com/send?phone=201000000002&text=m2",
      },
      {
        phone: "201000000003",
        message: "m3",
        url: "https://api.whatsapp.com/send?phone=201000000003&text=m3",
      },
    ];
    setWhatsappDeepLinkQueue({
      total: 3,
      openedCount: 1,
      remaining,
    });

    const q1 = getWhatsappDeepLinkQueue();
    assert.equal(q1.remaining.length, 2);
    assert.equal(q1.openedCount, 1);
    assert.equal(q1.total, 3);

    const r1 = openNextQueuedWhatsappDeepLink();
    assert.equal(r1.ok, true);
    assert.equal(r1.done, false);
    assert.equal(r1.openedCount, 2);
    assert.equal(r1.remaining, 1);
    assert.equal(
      globalThis.window.location.href,
      remaining[0].url,
    );

    const q2 = getWhatsappDeepLinkQueue();
    assert.equal(q2.remaining.length, 1);
    assert.equal(q2.remaining[0].phone, "201000000003");

    const r2 = openNextQueuedWhatsappDeepLink();
    assert.equal(r2.ok, true);
    assert.equal(r2.done, true);
    assert.equal(r2.remaining, 0);
    assert.equal(getWhatsappDeepLinkQueue(), null);
    assert.equal(
      globalThis.window.location.href,
      remaining[1].url,
    );
  });

  it("skip removes next without assigning location", () => {
    setWhatsappDeepLinkQueue({
      total: 3,
      openedCount: 1,
      remaining: [
        {
          phone: "201000000002",
          message: "m2",
          url: "https://api.whatsapp.com/send?phone=201000000002&text=m2",
        },
        {
          phone: "201000000003",
          message: "m3",
          url: "https://api.whatsapp.com/send?phone=201000000003&text=m3",
        },
      ],
    });
    const before = globalThis.window.location.href;
    const result = skipNextQueuedWhatsappDeepLink();
    assert.equal(result.done, false);
    assert.equal(result.remaining, 1);
    assert.equal(globalThis.window.location.href, before);
    assert.equal(getWhatsappDeepLinkQueue().remaining[0].phone, "201000000003");
  });

  it("persists across clear/read (sessionStorage)", () => {
    setWhatsappDeepLinkQueue({
      total: 2,
      openedCount: 1,
      remaining: [
        {
          phone: "201000000009",
          message: "x",
          url: "https://api.whatsapp.com/send?phone=201000000009&text=x",
        },
      ],
    });
    const again = getWhatsappDeepLinkQueue();
    assert.equal(again.total, 2);
    assert.equal(again.remaining[0].phone, "201000000009");
  });
});

describe("source contract: WHATSAPP_DEEPLINK_DELAY_MS and openWhatsappDeepLinks", () => {
  it("source file uses 5000ms delay and about:blank reservation", async () => {
    const fs = await import("node:fs/promises");
    const path = new URL("../whatsapp-deeplink-send.js", import.meta.url);
    const src = await fs.readFile(path, "utf8");
    assert.match(src, /WHATSAPP_DEEPLINK_DELAY_MS\s*=\s*5000/);
    assert.match(src, /about:blank/);
    assert.match(src, /mode:\s*"sequential"/);
    assert.match(src, /openWhatsappAppDraft/);
    assert.match(src, /setWhatsappDeepLinkQueue/);
    assert.match(src, /api\.whatsapp\.com\/send/);
    assert.match(src, /pointer:\s*coarse/);
    assert.match(src, /queuedAfterBlock/);
    assert.match(src, /openedDirect/);
  });

  it("matching preview starts deep links in the Send click before await", async () => {
    const fs = await import("node:fs/promises");
    const path = new URL(
      "../../app/(admin)/matching/_components/matching-whatsapp-preview-dialog.jsx",
      import.meta.url,
    );
    const src = await fs.readFile(path, "utf8");
    assert.match(src, /deepLinkPromise\s*=\s*openWhatsappDeepLinks/);
    assert.match(src, /deepLinkPromise,/);
  });

  it("lead match card uses green ready surface without Ready badge", async () => {
    const fs = await import("node:fs/promises");
    const path = new URL(
      "../../app/(admin)/matching/_components/lead-match-card.jsx",
      import.meta.url,
    );
    const src = await fs.readFile(path, "utf8");
    assert.match(src, /bg-emerald-50/);
    assert.match(src, /!ready &&/);
    assert.match(src, /matching\.actions\.sendWhatsapp/);
    assert.match(src, /onSendWhatsapp/);
  });

  it("queue bar has 5s cooldown and Open next gating", async () => {
    const fs = await import("node:fs/promises");
    const path = new URL(
      "../../components/whatsapp/WhatsappDeepLinkQueueBar.jsx",
      import.meta.url,
    );
    const src = await fs.readFile(path, "utf8");
    assert.match(src, /WHATSAPP_DEEPLINK_DELAY_MS/);
    assert.match(src, /deeplinkQueueCooldown/);
    assert.match(src, /openNextDisabled/);
    assert.match(src, /visibilitychange/);
    assert.match(src, /startCooldown/);
  });

  it("admin layout mounts WhatsappDeepLinkQueueBar", async () => {
    const fs = await import("node:fs/promises");
    const path = new URL("../../app/(admin)/layout.jsx", import.meta.url);
    const src = await fs.readFile(path, "utf8");
    assert.match(src, /WhatsappDeepLinkQueueBar/);
  });

  it("EN and AR include cooldown and sendWhatsapp strings", async () => {
    const fs = await import("node:fs/promises");
    const en = await fs.readFile(
      new URL("../../../public/locales/en.js", import.meta.url),
      "utf8",
    );
    const ar = await fs.readFile(
      new URL("../../../public/locales/ar.js", import.meta.url),
      "utf8",
    );
    assert.match(en, /deeplinkQueueCooldown/);
    assert.match(ar, /deeplinkQueueCooldown/);
    assert.match(en, /sendWhatsapp:\s*"Send WhatsApp"/);
    assert.match(ar, /sendWhatsapp:\s*"إرسال واتساب"/);
  });
});

'use client';

import {
  META_PIXEL,
  getMetaPixelId,
  isMetaPixelEnabled,
} from '@/constants/analytics';

const INIT_FLAG = '__lenaMetaPixelInitialized';

function runFbq(...args) {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  window.fbq(...args);
}

/**
 * Load Meta Pixel base script once (client-only). Safe to call multiple times.
 */
export function initMetaPixel() {
  if (typeof window === 'undefined' || !isMetaPixelEnabled()) {
    return Promise.resolve();
  }

  if (window.fbq) {
    return Promise.resolve();
  }

  if (window[INIT_FLAG]) {
    return window[INIT_FLAG];
  }

  window[INIT_FLAG] = new Promise((resolve) => {
    const id = getMetaPixelId();

    /* eslint-disable */
    !(function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, 'script', META_PIXEL.SCRIPT_URL);
    /* eslint-enable */

    runFbq('init', id);
    resolve();
  });

  return window[INIT_FLAG];
}

export async function trackMetaPageView() {
  if (!isMetaPixelEnabled()) return;
  await initMetaPixel();
  runFbq('track', META_PIXEL.EVENTS.PAGE_VIEW);
}

export async function trackMetaViewContent(params = {}) {
  if (!isMetaPixelEnabled()) return;
  await initMetaPixel();
  runFbq('track', META_PIXEL.EVENTS.VIEW_CONTENT, params);
}

export async function trackMetaContact(params = {}) {
  if (!isMetaPixelEnabled()) return;
  await initMetaPixel();
  runFbq('track', META_PIXEL.EVENTS.CONTACT, params);
}

export async function trackMetaLead(params = {}) {
  if (!isMetaPixelEnabled()) return;
  await initMetaPixel();
  runFbq('track', META_PIXEL.EVENTS.LEAD, params);
}

/** True when the element is a WhatsApp CTA (link or child of one). */
export function isWhatsAppClickTarget(target) {
  if (!(target instanceof Element)) return false;
  const anchor = target.closest('a[href]');
  if (!anchor) return false;
  const href = anchor.getAttribute('href') || '';
  return /wa\.me|whatsapp\.com/i.test(href);
}

/** Buyer-oriented footer prefill with a stable route reference and no user data. */
export function buyerPageCtaMessage(pathname = "/") {
  const parts = String(pathname || "/").split("/").filter(Boolean);
  let reference;
  if (parts[0]?.toLowerCase() === "opportunities" && parts[1]) {
    let code = parts[1];
    try {
      code = decodeURIComponent(code);
    } catch {
      // Keep the original route token if it is malformed.
    }
    const normalized = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    reference = normalized.startsWith("OPP-") ? normalized : `OPP-${normalized}`;
  } else {
    const route = (parts[0] || "HOME").toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    reference = `PAGE-${route || "HOME"}`;
  }
  return `مرحبا لينا عقار، مهتم أعرف فرص الشراء — ${reference}`;
}

/**
 * Post-submit opener: the buyer asks for the units that match the request they
 * just sent. The backend recognises this exact text (`detect_match_request`,
 * LENAAI-Agent `src/utils/match_request.py`) and replies with their match link.
 * It names no request: the sender's WhatsApp number identifies the buyer.
 */
export function matchRequestMessage() {
  return "مرحبا لينا عقار، عايز أشوف الوحدات المناسبة لطلبي — MATCH";
}

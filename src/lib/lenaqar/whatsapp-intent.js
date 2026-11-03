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

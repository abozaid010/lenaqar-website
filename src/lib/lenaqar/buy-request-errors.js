/**
 * Public error code for a failed buy-request call (what the form can act on).
 * Pure so `node --test` can cover it; `buy-request.server.js` uses it.
 *
 * `contact_required`: the backend did not accept the stored proof of ownership
 * (lead removed, reference no longer valid), so it treats the submit as a new
 * request and needs a name and phone. The form then asks for them.
 */
export function publicErrorCode(error, fallbackCode) {
  const response = error?.response;
  if (response?.status === 429) return "rate_limited";
  if (response?.status === 400) {
    const body = response.data;
    const text = String(body?.detail || body?.error_message || body?.message || "");
    if (/name and phone/i.test(text)) return "contact_required";
  }
  return fallbackCode;
}

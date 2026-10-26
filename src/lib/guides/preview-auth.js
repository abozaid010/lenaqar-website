/**
 * Preview routes require ?token= matching GUIDES_PREVIEW_TOKEN.
 * If the env var is unset, preview is open in development only.
 */
export function isPreviewAuthorized(token) {
  const expected = process.env.GUIDES_PREVIEW_TOKEN;
  if (!expected) {
    return process.env.NODE_ENV === "development";
  }
  return Boolean(token) && token === expected;
}

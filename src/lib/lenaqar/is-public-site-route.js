/**
 * Routes served by the `(lenaqar)` route group — public, unauthenticated
 * LenaQar site pages (src/app/(lenaqar)/*). A stale/absent CRM session on
 * these pages must surface as a normal error, never a navigation to /login —
 * these visitors were never asked to log in.
 */
const PUBLIC_SITE_ROUTE_PREFIXES = ["/", "/sell", "/calculator", "/opportunities"];

export function isPublicSiteRoute(pathname) {
  const path = String(pathname || "");
  return PUBLIC_SITE_ROUTE_PREFIXES.some(
    (prefix) =>
      path === prefix || (prefix !== "/" && path.startsWith(`${prefix}/`)),
  );
}

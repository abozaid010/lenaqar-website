/**
 * Server boot hook. Loads the opportunity catalogue and the Arabic name maps
 * in the background: from this build's disk snapshot when there is one (a
 * restart), otherwise from the API (~35 s walk; deploys wait on /api/ready).
 * Not awaited: the server accepts requests immediately; a request that arrives
 * mid-walk joins the same in-flight load.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NODE_ENV !== "production") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  const [{ warmOpportunityCatalog }, { warmArabicLabelMaps }] = await Promise.all([
    import("./lib/lenaqar/opportunities.server.js"),
    import("./lib/lenaqar/arabic-labels.server.js"),
  ]);
  // Both read this build's snapshot first (instant after a restart), then
  // refresh from the API in the background once it is stale.
  warmOpportunityCatalog();
  warmArabicLabelMaps();
}

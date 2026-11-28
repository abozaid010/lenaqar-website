/**
 * Server boot hook. Starts the opportunity catalogue walk (and the Arabic name
 * maps it needs) in the background, so the first visitor after a deploy reads
 * a warm in-process cache instead of waiting ~26 s for 300+ API pages.
 * Not awaited: the server accepts requests immediately; a request that arrives
 * mid-walk joins the same in-flight load.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NODE_ENV !== "production") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  const { warmOpportunityCatalog } = await import(
    "./lib/lenaqar/opportunities.server.js"
  );
  warmOpportunityCatalog();
}

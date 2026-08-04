/**
 * Registry of CRM helper tools.
 * Add a new tool: append one entry here + create its page under `app/(admin)/tools/`.
 * For a static public file, set `absolute: true` (skip clientId prefix) and optional `openInNewTab`.
 */

/**
 * @typedef {{
 *   id: string,
 *   titleKey: string,
 *   titleFallback: string,
 *   descriptionKey: string,
 *   descriptionFallback: string,
 *   href: string,
 *   absolute?: boolean,
 *   openInNewTab?: boolean,
 * }} ToolDefinition
 */

/** @type {ToolDefinition[]} */
export const TOOLS_REGISTRY = [
  {
    id: "present-value",
    titleKey: "tools.presentValue.title",
    titleFallback: "Present Value Calculator",
    descriptionKey: "tools.presentValue.description",
    descriptionFallback:
      "Compare cash and installment plans with one comparable value.",
    href: "/tools/present-value",
  },
  {
    id: "cairo-rtm-dashboard",
    titleKey: "tools.cairoRtmDashboard.title",
    titleFallback: "Cairo RTM Market Dashboard",
    descriptionKey: "tools.cairoRtmDashboard.description",
    descriptionFallback:
      "Compare Greater Cairo ready-to-move 3BR compounds (EGP 5–10M cash).",
    href: "/tools/cairo-rtm-market-dashboard.html",
    absolute: true,
    openInNewTab: true,
  },
];

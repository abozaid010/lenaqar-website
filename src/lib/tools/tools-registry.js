/**
 * Registry of CRM helper tools.
 * Add a new tool: append one entry here + create its page under `app/(admin)/tools/`.
 */

/**
 * @typedef {{ id: string, titleKey: string, titleFallback: string, descriptionKey: string, descriptionFallback: string, href: string }} ToolDefinition
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
];

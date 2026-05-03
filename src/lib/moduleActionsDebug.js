/**
 * Safe summary for dev logs (no tokens). Use after login / profile hydration.
 * @param {unknown} moduleActions
 * @returns {{ present: boolean, moduleCount: number, moduleKeys: string[], actionsByModule: Record<string, string> }}
 */
export function summarizeModuleActionsForLog(moduleActions) {
  if (
    moduleActions == null ||
    typeof moduleActions !== "object" ||
    Array.isArray(moduleActions)
  ) {
    return { present: false, moduleCount: 0, moduleKeys: [], actionsByModule: {} };
  }

  const moduleKeys = Object.keys(moduleActions).sort();
  const actionsByModule = {};
  for (const key of moduleKeys) {
    const acts = moduleActions[key];
    actionsByModule[key] = Array.isArray(acts)
      ? [...acts].map(String).sort().join(", ")
      : String(acts);
  }
  return {
    present: true,
    moduleCount: moduleKeys.length,
    moduleKeys,
    actionsByModule,
  };
}

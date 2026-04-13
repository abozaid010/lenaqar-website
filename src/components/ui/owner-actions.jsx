"use client";

import { useBrokerPermission } from "@/hooks/useBrokerPermission";

/**
 * Conditionally disables its children based on broker ownership.
 *
 * Usage:
 *   <OwnerActions item={project}>
 *     <EditButton />
 *     <DeleteButton />
 *   </OwnerActions>
 *
 * - Non-broker users: children always render normally.
 * - Broker users who OWN the item: children render normally.
 * - Broker users who do NOT own the item: children render in a disabled/greyed-out
 *   state (pointer-events blocked, reduced opacity, not-allowed cursor).
 *
 * @param {object} item     - The API object being guarded (project, developer, unit, …).
 * @param {React.ReactNode} children - Edit/delete buttons or any action nodes.
 */
export default function OwnerActions({ item, children }) {
  const { canModify } = useBrokerPermission();

  if (canModify(item)) return <>{children}</>;

  return (
    <div
      className="opacity-40 cursor-not-allowed pointer-events-none select-none"
      title="You can only modify your own items"
      aria-disabled="true"
    >
      {children}
    </div>
  );
}

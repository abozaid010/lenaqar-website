"use client";

import CoreActions from "./core-actions";

export default function StickyActionsBar() {
  return (
    <div className="fixed bottom-0 inset-x-0 z-50 lg:hidden border-t border-black/10 bg-white px-4 py-3">
      <CoreActions layout="row" className="w-full" />
    </div>
  );
}

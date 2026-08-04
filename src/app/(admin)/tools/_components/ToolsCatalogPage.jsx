"use client";

import Link from "next/link";
import { Wrench } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import { TOOLS_REGISTRY } from "@/lib/tools/tools-registry";
import { LenaCookiesManager } from "@/lib/LenaCookiesManager";

export default function ToolsCatalogPage() {
  const { translate } = useI18n();
  const clientId = LenaCookiesManager.getClientId();
  const prefix = clientId ? `/${clientId}` : "";

  return (
    <div className="max-w-3xl mx-auto w-full px-1 sm:px-0">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          {translate("tools.title", "Tools")}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          {translate(
            "tools.subtitle",
            "Helper utilities for pricing and planning"
          )}
        </p>
      </header>

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {TOOLS_REGISTRY.map((tool) => (
          <li key={tool.id}>
            <Link
              href={tool.absolute ? tool.href : `${prefix}${tool.href}`}
              {...(tool.openInNewTab
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className="flex flex-col h-full rounded-lg border border-gray-200 bg-white p-4 hover:border-primary/40 hover:bg-primary/[0.03] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <div className="flex items-start gap-3">
                <span className="shrink-0 mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Wrench className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-semibold text-gray-900">
                    {translate(tool.titleKey, tool.titleFallback)}
                  </h2>
                  <p className="mt-1 text-xs text-gray-600 leading-relaxed">
                    {translate(tool.descriptionKey, tool.descriptionFallback)}
                  </p>
                  <span className="mt-3 inline-block text-xs font-semibold text-primary">
                    {translate("tools.open", "Open")}
                  </span>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

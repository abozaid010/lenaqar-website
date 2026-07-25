"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import { useUnitByCode } from "@/hooks/use-unit-by-code";
import { useUnitOwnership } from "@/hooks/useUnitOwnership";
import { transformUnitToViewModel } from "@/lib/units/unit-selectors";
import { formatArea, isMeaningfulNumber } from "@/lib/units/unit-formatters";
import {
  buildAdminUnitDetailPath,
  buildAdminUnitEditPath,
  normalizeUnitCodeParam,
} from "@/lib/units/unit-share-links";
import { appendUnitsSourcePendingQuery } from "@/utils/units-navigation-source";
import { LenaCookiesManager } from "@/lib/LenaCookiesManager";

const INPUT_CLASS =
  "w-full ps-3 pe-9 py-[10px] h-11 min-h-11 bg-[#F6F7FB] rounded-[5px] border border-[#E6E6E6] text-[#494A4B] text-sm focus:outline-none focus:ring-primary focus:border-primary";

const URL_TRAILING_SEGMENTS = new Set(["edit", "whatsapp"]);

/** Accepts either a bare unit code or a pasted unit URL (public/admin, incl. /edit) and returns the code. */
function extractUnitCodeFromInput(raw) {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed || !/^https?:\/\//i.test(trimmed)) {
    return normalizeUnitCodeParam(trimmed) ?? trimmed;
  }
  try {
    const segments = new URL(trimmed).pathname.split("/").filter(Boolean);
    while (segments.length && URL_TRAILING_SEGMENTS.has(segments[segments.length - 1].toLowerCase())) {
      segments.pop();
    }
    const last = segments[segments.length - 1];
    return last ? (normalizeUnitCodeParam(last) ?? last) : trimmed;
  } catch {
    return trimmed;
  }
}

function Field({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-800 truncate">{value || "—"}</p>
    </div>
  );
}

export default function UnitCodeSearch() {
  const { t, locale, translate } = useI18n();
  const clientId = LenaCookiesManager.getClientId();
  const [inputValue, setInputValue] = useState("");
  const [submittedCode, setSubmittedCode] = useState("");

  const { rawUnit, isSearching, notFound, refetch } = useUnitByCode(submittedCode);
  const viewModel = rawUnit ? transformUnitToViewModel(rawUnit, t, locale) : null;
  const { isOwnUnit } = useUnitOwnership(viewModel);

  const handleSubmit = (e) => {
    e.preventDefault();
    const code = extractUnitCodeFromInput(inputValue);
    if (!code) return;
    setInputValue(code);
    if (code === submittedCode) {
      refetch();
    } else {
      setSubmittedCode(code);
    }
  };

  const handleClear = () => {
    setInputValue("");
    setSubmittedCode("");
  };

  const hasResult = Boolean(submittedCode);

  const detailHref = viewModel?.referenceCode
    ? appendUnitsSourcePendingQuery(
        buildAdminUnitDetailPath(viewModel.referenceCode, clientId),
        true
      )
    : null;
  const editHref = viewModel?.referenceCode
    ? appendUnitsSourcePendingQuery(
        buildAdminUnitEditPath(viewModel.referenceCode, clientId),
        true
      )
    : null;

  const bedrooms = isMeaningfulNumber(rawUnit?.roomsCount) ? rawUnit.roomsCount : null;
  const area = rawUnit ? formatArea(rawUnit.landArea) : null;
  const approvalStatusLabel =
    viewModel?.visibility === "pending_approval"
      ? translate("unitsFilter.pendingApproval", "Pending Approval")
      : viewModel?.visibility === "hidden"
        ? translate("unitsFilter.hidden", "Hidden")
        : viewModel?.visibility === "visible"
          ? translate("unitCodeSearch.visible", "Visible")
          : null;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 min-w-0">
      <form onSubmit={handleSubmit} className="flex items-end gap-2 min-w-0">
        <div className="flex-1 min-w-0">
          <label
            htmlFor="unit-code-search-input"
            className="block text-xs font-medium text-gray-700 mb-1"
          >
            {translate("unitCodeSearch.label", "Search by Unit Code")}
          </label>
          <div className="relative">
            <input
              id="unit-code-search-input"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={translate("unitCodeSearch.placeholder", "e.g. A-1023")}
              className={INPUT_CLASS}
              autoComplete="off"
            />
            {inputValue && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute end-2 top-1/2 -translate-y-1/2 flex items-center justify-center min-h-8 min-w-8 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                aria-label={translate("unitsSearch.clearAriaLabel", "Clear search")}
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
        <button
          type="submit"
          disabled={!inputValue.trim() || isSearching}
          className="shrink-0 flex items-center justify-center gap-2 h-11 min-h-11 px-4 rounded-[5px] bg-primary text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
        >
          <Search size={18} />
          <span className="hidden sm:inline">
            {translate("unitCodeSearch.searchButton", "Search")}
          </span>
        </button>
      </form>

      {hasResult && (
        <div className="mt-3">
          {isSearching ? (
            <p className="text-sm text-gray-500">
              {translate("unitCodeSearch.loading", "Searching for unit...")}
            </p>
          ) : notFound ? (
            <div className="rounded-md border border-[#E6E6E6] bg-[#F6F7FB] p-3">
              <p className="text-sm font-medium text-gray-800">
                {translate("unitCodeSearch.notFoundTitle", "No unit found with this code.")}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {translate(
                  "unitCodeSearch.notFoundHint",
                  "Please check the code and try again."
                )}
              </p>
            </div>
          ) : viewModel ? (
            <div className="rounded-md border-2 border-primary/20 bg-[#F8F8FF] p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                {translate("unitCodeSearch.resultTitle", "Search Result")}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-2 text-sm">
                <Field
                  label={translate("unitCodeSearch.fields.unitCode", "Unit Code")}
                  value={viewModel.referenceCode}
                />
                <Field
                  label={translate("unitCodeSearch.fields.project", "Project")}
                  value={
                    locale === "ar"
                      ? viewModel.projectNameAr || viewModel.projectName
                      : viewModel.projectName
                  }
                />
                <Field
                  label={translate("unitCodeSearch.fields.developer", "Developer")}
                  value={viewModel.developerName}
                />
                <Field
                  label={translate("unitCodeSearch.fields.location", "Location")}
                  value={viewModel.locationLabel}
                />
                <Field
                  label={translate("unitCodeSearch.fields.unitType", "Unit Type")}
                  value={viewModel.buildingType}
                />
                <Field label={translate("unitCodeSearch.fields.area", "Area")} value={area} />
                <Field
                  label={translate("unitCodeSearch.fields.bedrooms", "Bedrooms")}
                  value={bedrooms != null ? String(bedrooms) : null}
                />
                <Field
                  label={translate("unitCodeSearch.fields.price", "Price")}
                  value={viewModel.totalPrice}
                />
                <Field
                  label={translate("unitCodeSearch.fields.status", "Status")}
                  value={viewModel.purpose}
                />
                <Field
                  label={translate("unitCodeSearch.fields.approvalStatus", "Approval Status")}
                  value={approvalStatusLabel}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                {isOwnUnit && editHref && (
                  <Link
                    href={editHref}
                    className="w-full sm:w-auto sm:flex-none inline-flex items-center justify-center h-11 min-h-11 px-4 rounded-md bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    {translate("unitCodeSearch.editUnit", "Edit Unit")}
                  </Link>
                )}
                {detailHref && (
                  <Link
                    href={detailHref}
                    className="w-full sm:w-auto sm:flex-none inline-flex items-center justify-center h-11 min-h-11 px-4 rounded-md border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    {translate("unitCodeSearch.viewDetails", "View Details")}
                  </Link>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

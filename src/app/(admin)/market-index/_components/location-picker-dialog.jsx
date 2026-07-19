"use client";

import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import UnifiedDialog from "@/components/ui/UnifiedDialog";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { useI18n } from "@/hooks/useI18n";
import { fetchLocationRoots } from "@/utils/market-index-api";
import { useLocationChildren } from "@/hooks/use-market-index";

function locationLabel(node, locale) {
  if (!node) return "";
  if (locale === "ar" && node.ar_name) return node.ar_name;
  return node.en_name || node.id;
}

export default function LocationPickerDialog({ isOpen, onClose, onConfirm }) {
  const { translate, locale } = useI18n();
  const [stack, setStack] = useState([]); // breadcrumb of selected parents
  const [roots, setRoots] = useState([]);
  const [rootsLoading, setRootsLoading] = useState(false);
  const [rootsError, setRootsError] = useState(null);
  const [selected, setSelected] = useState(null);

  const parentId = stack.length > 0 ? stack[stack.length - 1].id : null;
  const childrenQuery = useLocationChildren(isOpen && parentId ? parentId : null);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setStack([]);
    setSelected(null);
    setRootsError(null);
    setRootsLoading(true);
    fetchLocationRoots()
      .then((data) => {
        if (cancelled) return;
        setRoots(Array.isArray(data?.locations) ? data.locations : []);
      })
      .catch((err) => {
        if (cancelled) return;
        setRootsError(err?.message || translate("marketIndex.errors.loadFailed"));
        setRoots([]);
      })
      .finally(() => {
        if (!cancelled) setRootsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, translate]);

  const list = parentId
    ? Array.isArray(childrenQuery.data?.locations)
      ? childrenQuery.data.locations
      : []
    : roots;

  const listLoading = parentId ? childrenQuery.isLoading : rootsLoading;
  const listError = parentId
    ? childrenQuery.isError
      ? childrenQuery.error?.message
      : null
    : rootsError;

  const canConfirm = selected?.is_leaf === true;

  const handlePick = (node) => {
    if (node.is_leaf) {
      setSelected(node);
      return;
    }
    setSelected(null);
    setStack((prev) => [...prev, node]);
  };

  const goToBreadcrumb = (index) => {
    setSelected(null);
    if (index < 0) {
      setStack([]);
      return;
    }
    setStack((prev) => prev.slice(0, index + 1));
  };

  return (
    <UnifiedDialog
      isOpen={isOpen}
      onClose={onClose}
      title={translate("marketIndex.picker.title")}
      cancelLabel={translate("common.cancel")}
      submitLabel={translate("marketIndex.picker.confirm")}
      submitDisabled={!canConfirm}
      onSubmit={() => {
        if (canConfirm) onConfirm(selected.id);
      }}
      dialogClassName="max-w-2xl"
      bodyClassName="p-4 overflow-y-auto"
    >
      <div className="flex flex-col gap-3">
        <nav className="flex flex-wrap items-center gap-1 text-sm text-gray-600">
          <button
            type="button"
            className="hover:text-primary"
            onClick={() => goToBreadcrumb(-1)}
          >
            {translate("marketIndex.picker.roots")}
          </button>
          {stack.map((node, i) => (
            <span key={node.id} className="inline-flex items-center gap-1">
              <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
              <button
                type="button"
                className="hover:text-primary"
                onClick={() => goToBreadcrumb(i)}
              >
                {locationLabel(node, locale)}
              </button>
            </span>
          ))}
        </nav>

        {listLoading ? (
          <LoadingSpinner
            size={40}
            containerClassName="flex items-center justify-center h-40"
          />
        ) : listError ? (
          <p className="text-sm text-red-600">{listError}</p>
        ) : list.length === 0 ? (
          <p className="text-sm text-gray-500">{translate("marketIndex.picker.empty")}</p>
        ) : (
          <ul className="divide-y divide-gray-100 border border-gray-200 rounded-lg max-h-80 overflow-y-auto">
            {list.map((node) => {
              const isSelected = selected?.id === node.id;
              return (
                <li key={node.id}>
                  <button
                    type="button"
                    onClick={() => handlePick(node)}
                    className={`w-full flex items-center justify-between gap-2 px-4 py-3 text-start hover:bg-gray-50 ${
                      isSelected ? "bg-primary/5 text-primary" : "text-gray-900"
                    }`}
                  >
                    <span>
                      {locationLabel(node, locale)}
                      {node.is_leaf && (
                        <span className="ms-2 text-xs text-gray-500">
                          ({translate("marketIndex.picker.leaf")})
                        </span>
                      )}
                    </span>
                    {!node.is_leaf && (
                      <ChevronRight className="h-4 w-4 text-gray-400 shrink-0 rtl:rotate-180" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {!canConfirm && selected === null && (
          <p className="text-xs text-gray-500">
            {translate("marketIndex.picker.leafHint")}
          </p>
        )}
      </div>
    </UnifiedDialog>
  );
}

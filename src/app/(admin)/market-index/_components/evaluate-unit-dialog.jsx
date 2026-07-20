"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import UnifiedDialog from "@/components/ui/UnifiedDialog";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { useI18n } from "@/hooks/useI18n";
import { useActiveCard, useEstimate } from "@/hooks/use-market-index";
import MarketLocationSearch from "./market-location-search";
import MarketSnapshot from "./market-snapshot";
import EvaluateForm, {
  formToEstimateRequest,
  validateEvaluateForm,
} from "./evaluate-form";
import EstimateResult from "./estimate-result";

function emptyForm() {
  return {
    property_type: "",
    area_sqm: "",
    bedrooms: "",
    bathrooms: "",
    view: "",
    finishing: "",
  };
}

export default function EvaluateUnitDialog({ isOpen, onClose }) {
  const { translate, locale } = useI18n();
  const [leaf, setLeaf] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [result, setResult] = useState(null);

  const leafId = leaf?.is_leaf ? leaf.id : null;
  const activeQuery = useActiveCard(isOpen ? leafId : null);
  const estimateMutation = useEstimate();

  useEffect(() => {
    if (!isOpen) return;
    setLeaf(null);
    setLocationError(null);
    setForm(emptyForm());
    setErrors({});
    setResult(null);
  }, [isOpen]);

  useEffect(() => {
    setResult(null);
    setErrors({});
  }, [leafId]);

  const unpublished =
    Boolean(leafId) && activeQuery.isSuccess && activeQuery.data === null;
  const publishedCard = activeQuery.data || null;
  const formDisabled =
    !leafId || unpublished || activeQuery.isLoading || estimateMutation.isPending;

  const bedroomHints = useMemo(() => {
    if (!publishedCard?.units) return [];
    return [
      ...new Set(
        publishedCard.units
          .map((u) => u.bedrooms)
          .filter((n) => n != null)
          .sort((a, b) => a - b)
      ),
    ];
  }, [publishedCard]);

  const bathroomHints = useMemo(() => {
    if (!publishedCard?.units) return [];
    return [
      ...new Set(
        publishedCard.units
          .map((u) => u.bathrooms)
          .filter((n) => n != null)
          .sort((a, b) => a - b)
      ),
    ];
  }, [publishedCard]);

  const handleEvaluate = async () => {
    if (!leafId) {
      setLocationError(translate("marketEvaluate.validation.required"));
      return;
    }
    if (unpublished) return;

    const nextErrors = validateEvaluateForm(form, translate);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      const data = await estimateMutation.mutateAsync(
        formToEstimateRequest(form, leafId)
      );
      setResult(data);
    } catch (err) {
      if (err?.status === 404) {
        setResult(null);
        toast.error(translate("marketEvaluate.empty.message"));
        return;
      }
      if (err?.status === 400) {
        toast.error(translate("marketEvaluate.errors.invalidInput"));
        return;
      }
      if (err?.status === 401 || err?.status === 403) {
        toast.error(translate("marketEvaluate.errors.unauthorized"));
        return;
      }
      toast.error(
        err?.message || translate("marketEvaluate.errors.estimateFailed")
      );
    }
  };

  return (
    <UnifiedDialog
      isOpen={isOpen}
      onClose={onClose}
      title={translate("marketEvaluate.title")}
      cancelLabel={translate("common.cancel")}
      submitLabel={
        estimateMutation.isPending
          ? translate("marketEvaluate.form.evaluating")
          : translate("marketEvaluate.form.submit")
      }
      submitDisabled={formDisabled || !leafId}
      submitLoading={estimateMutation.isPending}
      onSubmit={handleEvaluate}
      dialogClassName="!w-[90%] !max-w-none h-[90vh] min-h-[90vh] max-h-[90vh]"
      bodyClassName="p-4 overflow-y-auto flex-1 min-h-0"
    >
      <div className="flex flex-col gap-4">
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-gray-900">
            {translate("marketEvaluate.picker.sectionTitle")}
          </h2>
          <MarketLocationSearch
            enabled={isOpen}
            leaf={leaf}
            onLeafChange={(next) => {
              setLeaf(next);
              setLocationError(null);
            }}
            error={locationError}
          />
        </section>

        {leafId && activeQuery.isLoading && (
          <LoadingSpinner
            size={36}
            containerClassName="flex items-center justify-center h-24"
          />
        )}

        {unpublished && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-sm font-medium text-amber-900">
              {translate("marketEvaluate.empty.title")}
            </p>
            <p className="text-sm text-amber-800 mt-1">
              {translate("marketEvaluate.empty.message")}
            </p>
          </div>
        )}

        {leafId && !unpublished && publishedCard && (
          <MarketSnapshot card={publishedCard} locale={locale} />
        )}

        {leafId && !unpublished && (
          <EvaluateForm
            form={form}
            onChange={(next) => {
              setForm(next);
              setErrors({});
            }}
            errors={errors}
            disabled={formDisabled}
            submitting={estimateMutation.isPending}
            onSubmit={handleEvaluate}
            bedroomHints={bedroomHints}
            bathroomHints={bathroomHints}
            showSubmitButton={false}
            compact
          />
        )}

        {(result || estimateMutation.isPending) && (
          <EstimateResult result={result} />
        )}
      </div>
    </UnifiedDialog>
  );
}

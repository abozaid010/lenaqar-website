"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import BackButton from "@/components/ui/back-button";
import { useI18n } from "@/hooks/useI18n";
import { getClientIdFromToken } from "@/lib/getRoleFromToken.client";
import { useMarketCard, useSaveCard } from "@/hooks/use-market-index";
import CardGeneralForm, {
  generalToFormState,
  serializeGeneral,
  validateGeneralForm,
} from "./card-general-form";
import AdjustmentsEditor, {
  adjustmentsToRows,
  serializeAdjustments,
} from "./adjustments-editor";
import ReferenceUnitsTable from "./reference-units-table";
import PublishPanel from "./publish-panel";
import VersionHistoryDialog from "./version-history-dialog";

export default function CardEditor({
  canEdit = false,
  unavailable = false,
  location,
  locationId,
  initialCard,
  initialUnits = [],
  isNewDraft = false,
}) {
  const { translate, locale } = useI18n();
  const clientId = getClientIdFromToken() || "";
  const fallbackRoute = `/${clientId}/market-index`;

  const initialData = useMemo(() => {
    if (unavailable || !initialCard) return undefined;
    return { card: initialCard, units: initialUnits };
  }, [unavailable, initialCard, initialUnits]);

  const cardQuery = useMarketCard(
    canEdit && !unavailable ? locationId : null,
    initialData
  );

  const card = cardQuery.data?.card || initialCard;
  const units = cardQuery.data?.units || initialUnits || [];

  const [generalState, setGeneralState] = useState(() =>
    generalToFormState(initialCard?.general)
  );
  const [viewRows, setViewRows] = useState(
    () => adjustmentsToRows(initialCard?.adjustments).viewRows
  );
  const [finishingRows, setFinishingRows] = useState(
    () => adjustmentsToRows(initialCard?.adjustments).finishingRows
  );
  const [fieldErrors, setFieldErrors] = useState({});
  const [evidenceErrors, setEvidenceErrors] = useState([]);
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const saveMutation = useSaveCard(locationId);

  useEffect(() => {
    if (!card?.general) return;
    setGeneralState(generalToFormState(card.general));
    const rows = adjustmentsToRows(card.adjustments);
    setViewRows(rows.viewRows);
    setFinishingRows(rows.finishingRows);
  }, [card?.updated_at, card?.general, card?.adjustments]);

  const breadcrumb =
    Array.isArray(location?.path_en) && location.path_en.length
      ? location.path_en.join(" / ")
      : location?.en_name || locationId;

  const status = card?.status || "draft";
  const activeVersion = card?.active_version ?? 0;
  const cardExistsOnServer = Boolean(card?.created_at);

  const handleSave = async () => {
    if (!canEdit) return;
    const { errors, evidenceErrors: evErrs } = validateGeneralForm(
      generalState,
      translate
    );
    setFieldErrors(errors);
    setEvidenceErrors(evErrs);
    if (Object.keys(errors).length > 0 || evErrs.length > 0) {
      toast.error(translate("marketIndex.validation.fixInvalid"));
      return;
    }

    try {
      await saveMutation.mutateAsync({
        general: serializeGeneral(generalState),
        adjustments: serializeAdjustments(viewRows, finishingRows),
      });
      toast.success(translate("marketIndex.toasts.draftSaved"));
    } catch (err) {
      toast.error(err?.message || translate("marketIndex.errors.saveFailed"));
    }
  };

  if (unavailable) {
    return (
      <div className="p-4 md:p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <BackButton fallbackRoute={fallbackRoute} />
        </div>
        <h1 className="text-xl font-semibold text-gray-900">
          {location?.en_name || locationId}
        </h1>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-start">
          <p className="text-amber-900 font-medium">
            {translate("marketIndex.unavailable.title")}
          </p>
          <p className="text-amber-800 mt-2 text-sm">
            {translate("marketIndex.unavailable.message")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 flex flex-col gap-6 min-h-0 overflow-y-auto">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-2 min-w-0">
          <BackButton fallbackRoute={fallbackRoute} />
          <h1 className="text-xl font-semibold text-gray-900 truncate">
            {locale === "ar" && location?.ar_name
              ? location.ar_name
              : location?.en_name || locationId}
          </h1>
          <p className="text-sm text-gray-500 truncate">{breadcrumb}</p>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span
              className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                status === "published"
                  ? "bg-green-100 text-green-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {translate(`marketIndex.status.${status}`)}
            </span>
            <span className="text-gray-600">
              {translate("marketIndex.table.versionLabel").replace(
                "{n}",
                String(activeVersion)
              )}
            </span>
            {isNewDraft && (
              <span className="text-xs text-gray-500">
                {translate("marketIndex.editor.newDraft")}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canEdit && (
            <>
              <button
                type="button"
                onClick={() => setHistoryOpen(true)}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
              >
                {translate("marketIndex.actions.history")}
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 disabled:opacity-60"
              >
                {saveMutation.isPending
                  ? translate("common.loading")
                  : translate("marketIndex.actions.saveDraft")}
              </button>
              <button
                type="button"
                onClick={() => setPublishConfirmOpen(true)}
                disabled={!cardExistsOnServer}
                className="px-4 py-2 rounded-lg border border-primary text-primary text-sm font-medium hover:bg-primary/5 disabled:opacity-50 disabled:pointer-events-none"
              >
                {translate("marketIndex.actions.publish")}
              </button>
            </>
          )}
        </div>
      </div>

      <CardGeneralForm
        state={generalState}
        onChange={setGeneralState}
        canEdit={canEdit}
        fieldErrors={fieldErrors}
        evidenceErrors={evidenceErrors}
      />

      <AdjustmentsEditor
        viewRows={viewRows}
        finishingRows={finishingRows}
        onViewRowsChange={setViewRows}
        onFinishingRowsChange={setFinishingRows}
        canEdit={canEdit}
      />

      <ReferenceUnitsTable
        locationId={locationId}
        units={units}
        canEdit={canEdit && cardExistsOnServer}
      />

      {!cardExistsOnServer && canEdit && (
        <p className="text-sm text-gray-500 -mt-2">
          {translate("marketIndex.editor.saveBeforeUnits")}
        </p>
      )}

      {canEdit && (
        <>
          <PublishPanel
            locationId={locationId}
            locationName={location?.en_name || locationId}
            activeVersion={activeVersion}
            canEdit={canEdit}
            confirmOpen={publishConfirmOpen}
            onConfirmOpenChange={setPublishConfirmOpen}
            onPublished={() => cardQuery.refetch()}
          />
          <VersionHistoryDialog
            isOpen={historyOpen}
            onClose={() => setHistoryOpen(false)}
            locationId={locationId}
          />
        </>
      )}
    </div>
  );
}

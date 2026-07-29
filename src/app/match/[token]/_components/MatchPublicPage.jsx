"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Copy,
  Loader2,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import {
  getMatchShareContext,
  savePublicUnitReaction,
  submitMatchViewingRequest,
} from "@/utils/api";
import { fetchPublicMatchedUnits } from "@/lib/match/public-api";
import { requirementToFilterChips } from "@/lib/match/requirement-to-units-filter";
import { formatPhoneForWhatsApp, copyToClipboard } from "@/utils/phone-utils";
import SmartDateTimePicker from "@/components/ui/smart-date-time-picker";
import MatchUnitCard from "./MatchUnitCard";

export default function MatchPublicPage({ token }) {
  const { translate, locale } = useI18n();
  const [loading, setLoading] = useState(true);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [context, setContext] = useState(null);
  const [units, setUnits] = useState([]);
  const [likedIds, setLikedIds] = useState(new Set());
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [savingLikeId, setSavingLikeId] = useState(null);
  const [meetingTime, setMeetingTime] = useState("");
  const [submittingViewing, setSubmittingViewing] = useState(false);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/match/${token}`;
  }, [token]);

  const showPresentValue = Boolean(
    context?.include_present_value ?? context?.includePresentValue
  );

  const leadName =
    context?.lead?.name || context?.lead?.display_name || "";
  const leadPhone =
    context?.lead?.phone_number || context?.lead?.phoneNumber || "";

  const filterChips = useMemo(
    () =>
      requirementToFilterChips(context?.requirements, (key, fb) =>
        translate(key, fb),
      ),
    [context?.requirements, translate],
  );

  const loadUnits = useCallback(async (unitFilters) => {
    if (!unitFilters || Object.keys(unitFilters).length === 0) return;
    setUnitsLoading(true);
    try {
      const { units: list } = await fetchPublicMatchedUnits(unitFilters);
      setUnits(list);
    } catch (e) {
      toast.error(e?.message || translate("matchPage.unitsLoadFailed", "Failed to load units"));
      setUnits([]);
    } finally {
      setUnitsLoading(false);
    }
  }, [translate]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getMatchShareContext(token);
        if (cancelled) return;
        setContext(data);
        const initialLiked = new Set(
          (data?.liked_unit_ids || []).map(String),
        );
        setLikedIds(initialLiked);
        await loadUnits(data?.unit_filters || {});
      } catch (e) {
        if (!cancelled) setError(e?.message || "Invalid link");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, loadUnits]);

  const handleCopyLink = () => {
    copyToClipboard(
      shareUrl,
      () => toast.success(translate("matchPage.linkCopied", "Link copied")),
      () => toast.error(translate("matchPage.copyFailed", "Could not copy link")),
    );
  };

  const handleWhatsAppShare = () => {
    const message = translate(
      "matchPage.whatsappMessage",
      locale === "ar"
        ? "مرحباً، هذه الوحدات المقترحة لك:"
        : "Hi, here are property options matched for you:",
    );
    const text = `${message}\n${shareUrl}`;
    const url = formatPhoneForWhatsApp(leadPhone, text);
    if (!url) {
      toast.error(translate("matchPage.noPhone", "Phone number not available"));
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleToggleLike = async (unitId) => {
    if (!unitId) return;
    const nextLiked = !likedIds.has(unitId);
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (nextLiked) next.add(unitId);
      else next.delete(unitId);
      return next;
    });
    setSavingLikeId(unitId);
    try {
      const res = await savePublicUnitReaction(token, unitId, nextLiked);
      if (res?.liked_unit_ids) {
        setLikedIds(new Set(res.liked_unit_ids.map(String)));
      }
    } catch (e) {
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (nextLiked) next.delete(unitId);
        else next.add(unitId);
        return next;
      });
      toast.error(e?.message || translate("common.operationFailed", "Operation failed"));
    } finally {
      setSavingLikeId(null);
    }
  };

  const handleToggleSelect = (unitId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(unitId)) next.delete(unitId);
      else next.add(unitId);
      return next;
    });
  };

  const handleSubmitViewing = async (e) => {
    e.preventDefault();
    const ids = [...selectedIds];
    if (!ids.length) {
      toast.error(translate("matchPage.selectUnits", "Select at least one unit"));
      return;
    }
    if (!meetingTime) {
      toast.error(translate("matchPage.pickDateTime", "Choose date and time"));
      return;
    }
    setSubmittingViewing(true);
    try {
      await submitMatchViewingRequest(token, {
        unitIds: ids,
        meetingTime: new Date(meetingTime).toISOString(),
      });
      toast.success(
        translate("matchPage.viewingSubmitted", "Viewing request submitted"),
      );
      setSelectedIds(new Set());
      setMeetingTime("");
    } catch (err) {
      toast.error(err?.message || translate("common.operationFailed", "Operation failed"));
    } finally {
      setSubmittingViewing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#E2DBFF]/10">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[#E2DBFF]/10">
        <p className="text-sm text-red-600 mb-2">{error}</p>
        <p className="text-xs text-gray-500">
          {translate("matchPage.invalidLinkHint", "Ask your agent for a new link.")}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E2DBFF]/10">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-5 h-5 text-primary shrink-0" aria-hidden />
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-gray-900 truncate">
                {translate("matchPage.title", "Matched properties")}
              </h1>
              {leadName && (
                <p className="text-xs text-gray-500 truncate">{leadName}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 rounded-md hover:bg-gray-50"
            >
              <Copy className="w-3.5 h-3.5" />
              {translate("matchPage.copyLink", "Copy link")}
            </button>
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              {translate("matchPage.whatsapp", "WhatsApp")}
            </button>
          </div>
        </div>

        {filterChips.length > 0 && (
          <div className="max-w-5xl mx-auto px-3 sm:px-4 pb-3">
            <div className="flex flex-wrap gap-1.5 max-h-[3.25rem] overflow-hidden line-clamp-2">
              {filterChips.map((chip) => (
                <span
                  key={`${chip.label}-${chip.value}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/5 border border-primary/10 text-[11px] text-gray-700"
                >
                  <span className="text-gray-500">{chip.label}:</span>
                  <span className="font-medium">{chip.value}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="max-w-5xl mx-auto px-3 sm:px-4 py-4 space-y-4">
        {unitsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : units.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-12">
            {translate("matchPage.noUnits", "No matching units found.")}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {units.map((unit) => {
              const id = unit?.unitId || unit?.unit_id || unit?.id;
              return (
                <MatchUnitCard
                  key={id}
                  unit={unit}
                  liked={likedIds.has(String(id))}
                  selected={selectedIds.has(String(id))}
                  onToggleLike={handleToggleLike}
                  onToggleSelect={handleToggleSelect}
                  savingLike={savingLikeId === String(id)}
                  showPresentValue={showPresentValue}
                />
              );
            })}
          </div>
        )}

        {selectedIds.size > 0 && (
          <form
            onSubmit={handleSubmitViewing}
            className="sticky bottom-0 rounded-xl border border-gray-200 bg-white p-3 sm:p-4 shadow-lg space-y-3"
          >
            <p className="text-xs font-medium text-gray-700">
              {translate("matchPage.arrangeViewing", "Arrange viewing")} (
              {selectedIds.size})
            </p>
            <SmartDateTimePicker
              value={meetingTime}
              onChange={setMeetingTime}
              required
            />
            <button
              type="submit"
              disabled={submittingViewing}
              className="w-full sm:w-auto sm:ms-auto block px-4 py-2 bg-primary text-white text-sm font-medium rounded-md disabled:opacity-60"
            >
              {submittingViewing
                ? translate("common.saving", "Saving...")
                : translate("matchPage.requestViewing", "Request viewing")}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}

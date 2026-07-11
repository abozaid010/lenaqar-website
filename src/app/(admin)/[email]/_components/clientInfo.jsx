"use client";

import LoadingSpinner from "@/components/ui/loading-spinner";
import { COOKIE_KEYS } from "@/constants/cookieKeys";
import { getProfileData, runDailyEngagement, updateProfileData } from "@/utils/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Loader2, Copy, Share2, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useI18n } from "@/hooks/useI18n";
import { LenaCookiesManager } from "@/lib/LenaCookiesManager";
import { PhoneField } from "@/components/phone/PhoneField";
import AutomationAgentsSection from "./AutomationAgentsSection";
import OpenwaConnectionAccess from "@/components/whatsapp/OpenwaConnectionAccess";

export default function ClientInfo({ client_email }) {
  const { t, translate } = useI18n();
  const queryClient = useQueryClient();
  const MAX_SUGGESTED_QUESTIONS = 5;
  const { data, isLoading } = useQuery({
    queryKey: ["clientData"],
    queryFn: getProfileData,
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
  });

  const router = useRouter();
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [formData, setFormData] = useState({
    phone_number: data?.data?.phone_number,
    email: data?.data?.email,
    price_percentage: data?.data?.price_percentage || 0,
    accurate_queries_level: data?.data?.accurate_queries_level || 0,
    chatbot_welcome_message: data?.data?.chatbot_welcome_message || "",
    chatbot_initial_suggestions: data?.data?.chatbot_initial_suggestions || [""],
  });
  const [isChanged, setIsChanged] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showFollowUpConfirm, setShowFollowUpConfirm] = useState(false);
  const [followUpLoading, setFollowUpLoading] = useState(false);

  // Helper function to count words
  const countWords = (text) => {
    if (!text || !text.trim()) return 0;
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  };

  // Helper function to normalize data for comparison
  const normalizeDataForComparison = (data) => {
    if (!data) return {};
    const normalized = { ...data };
    // Normalize chatbot_initial_suggestions to array format
    if (normalized.chatbot_initial_suggestions) {
      if (Array.isArray(normalized.chatbot_initial_suggestions)) {
        const limited = normalized.chatbot_initial_suggestions
          .slice(0, MAX_SUGGESTED_QUESTIONS)
          .map((s) => (typeof s === "string" ? s : ""))
          .filter((s) => typeof s === "string");
        normalized.chatbot_initial_suggestions =
          limited.length > 0 ? limited : [""];
      } else {
        normalized.chatbot_initial_suggestions = [""];
      }
    } else {
      normalized.chatbot_initial_suggestions = [""];
    }
    if (!normalized.chatbot_welcome_message) {
      normalized.chatbot_welcome_message = "";
    }
    return normalized;
  };

  const clientId = data?.data?.client_id || LenaCookiesManager.getClientId();
  const shareableLink = clientId ? `https://chat.lenaai.net/?client=${clientId}` : "";

  useEffect(() => {
    const suggestions = data?.data?.chatbot_initial_suggestions || [];
    setFormData({
      phone_number: data?.data?.phone_number,
      email: data?.data?.email,
      price_percentage: data?.data?.price_percentage || 0,
      accurate_queries_level: data?.data?.accurate_queries_level || 0,
      chatbot_welcome_message: data?.data?.chatbot_welcome_message || "",
      chatbot_initial_suggestions:
        Array.isArray(suggestions) && suggestions.length > 0
          ? suggestions.slice(0, MAX_SUGGESTED_QUESTIONS).map((s) => s || "")
          : [""],
    });
  }, [isLoading]);

  const handleCopyLink = async () => {
    if (!shareableLink) return;

    try {
      await navigator.clipboard.writeText(shareableLink);
      setCopied(true);
      toast.success(t.clientInfo.linkCopied);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error(t.clientInfo.copyFailed || "Failed to copy link");
    }
  };

  const handleShareLink = async () => {
    if (!shareableLink) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "LenaAI Chat Link",
          text: "Check out my LenaAI chat link",
          url: shareableLink,
        });
      } catch (error) {
        if (error.name !== "AbortError") {
          toast.error(t.clientInfo.shareFailed || "Failed to share link");
        }
      }
    } else {
      // Fallback: copy to clipboard if Web Share API is not available
      handleCopyLink();
    }
  };

  function handleChange(e) {
    const { name, value } = e.target;

    if (name === "price_percentage" && parseFloat(value) > 100) {
      toast.error("Percentage cannot exceed 100%");
      return;
    }

    // Handle welcome message word limit (50 words)
    if (name === "chatbot_welcome_message") {
      const wordCount = countWords(value);
      if (wordCount > 50) {
        toast.error(
          t.clientInfo.welcomeMessageWordLimit ||
            "Welcome message cannot exceed 50 words"
        );
        return;
      }
    }

    // Handle initial suggestions word limit (20 words each)
    if (name.startsWith("chatbot_initial_suggestions_")) {
      const index = parseInt(name.split("_")[3]);
      const wordCount = countWords(value);
      if (wordCount > 20) {
        toast.error(
          t.clientInfo.suggestionWordLimit ||
            "Each suggested question cannot exceed 20 words"
        );
        return;
      }
      setFormData((prev) => {
        const updated = {
          ...prev,
          chatbot_initial_suggestions: (prev.chatbot_initial_suggestions || []).map(
            (item, i) => (i === index ? value : item)
          ),
        };
        const normalizedData = normalizeDataForComparison(data?.data);
        setIsChanged(JSON.stringify(updated) !== JSON.stringify(normalizedData));
        return updated;
      });
      return;
    }

    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      const normalizedData = normalizeDataForComparison(data?.data);
      setIsChanged(JSON.stringify(updated) !== JSON.stringify(normalizedData));
      return updated;
    });
  }

  const addSuggestedQuestion = () => {
    setFormData((prev) => {
      const current = Array.isArray(prev.chatbot_initial_suggestions)
        ? prev.chatbot_initial_suggestions
        : [""];
      if (current.length >= MAX_SUGGESTED_QUESTIONS) {
        toast.error(
          t.clientInfo.maxSuggestions ||
            `You can add up to ${MAX_SUGGESTED_QUESTIONS} questions`
        );
        return prev;
      }
      const updated = {
        ...prev,
        chatbot_initial_suggestions: [...current, ""],
      };
      const normalizedData = normalizeDataForComparison(data?.data);
      setIsChanged(JSON.stringify(updated) !== JSON.stringify(normalizedData));
      return updated;
    });
  };

  const removeSuggestedQuestion = (index) => {
    setFormData((prev) => {
      const current = Array.isArray(prev.chatbot_initial_suggestions)
        ? prev.chatbot_initial_suggestions
        : [""];
      const next = current.filter((_, i) => i !== index);
      const updated = {
        ...prev,
        chatbot_initial_suggestions: next.length > 0 ? next : [""],
      };
      const normalizedData = normalizeDataForComparison(data?.data);
      setIsChanged(JSON.stringify(updated) !== JSON.stringify(normalizedData));
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoadingSubmit(true);
      const trimmedSuggestions = (formData.chatbot_initial_suggestions || []).map(
        (s) => (typeof s === "string" ? s.trim() : "")
      );

      if (trimmedSuggestions.length > MAX_SUGGESTED_QUESTIONS) {
        toast.error(
          t.clientInfo.maxSuggestions ||
            `You can add up to ${MAX_SUGGESTED_QUESTIONS} questions`
        );
        return;
      }

      // Require at least 1 question, and no empty questions
      if (trimmedSuggestions.some((q) => !q)) {
        toast.error(
          t.clientInfo.fillAllSuggestions ||
            "Please fill all suggested questions (or remove empty ones) before saving."
        );
        return;
      }

      // Double-check word count validation (in case of pasted/auto-fill)
      const tooLong = trimmedSuggestions.find((q) => countWords(q) > 20);
      if (tooLong) {
        toast.error(
          t.clientInfo.suggestionWordLimit ||
            "Each suggested question cannot exceed 20 words"
        );
        return;
      }

      // Send ALL entered questions to API (trimmed, up to 5)
      const submitData = {
        ...formData,
        chatbot_initial_suggestions: trimmedSuggestions,
      };
      await updateProfileData(submitData);
      toast.success(t.clientInfo.profileUpdated);
      setIsChanged(false);
      setTimeout(() => {
        router.refresh();
      }, 500);
    } catch (error) {
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleFollowUpNow = () => setShowFollowUpConfirm(true);

  const cancelFollowUpNow = () => setShowFollowUpConfirm(false);

  const confirmFollowUpNow = async () => {
    if (!clientId) {
      toast.error(translate("clientInfo.followUpNowFailed"));
      return;
    }

    try {
      setFollowUpLoading(true);
      await runDailyEngagement(clientId, false);
      toast.success(translate("clientInfo.followUpNowSuccess"));
      setShowFollowUpConfirm(false);
    } catch (error) {
      toast.error(translate("clientInfo.followUpNowFailed"));
    } finally {
      setFollowUpLoading(false);
    }
  };

  const handleLogout = () => setShowLogoutConfirm(true);

  const cancelLogout = () => setShowLogoutConfirm(false);

  const confirmLogout = async () => {
    try {
      await fetch("/api/auth/clear-session", {
        method: "POST",
        credentials: "include",
      });
      LenaCookiesManager.clearAuthCookies();

      if (typeof window !== "undefined") {
        queryClient.removeQueries({ queryKey: ["data-projection"] });
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
      toast.success(translate("header.logoutSuccess"));
    } catch (error) {
      console.error("Logout error:", error?.message ?? error);
    } finally {
      window.location.href = "/";
    }
  };

  return (
    <>
      {showFollowUpConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80 m-4 animate-fade-in">
            <div className="flex flex-col items-center text-center mb-4">
              <div className="bg-red-100 p-3 rounded-full mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">
                {translate("clientInfo.followUpNowConfirmTitle")}
              </h3>
              <p className="text-gray-600 mt-2">
                {translate("clientInfo.followUpNowConfirmMessage")}
              </p>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={cancelFollowUpNow}
                disabled={followUpLoading}
                className="flex-1 py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md font-medium transition-colors disabled:opacity-60"
              >
                {translate("clientInfo.followUpNowCancel")}
              </button>
              <button
                type="button"
                onClick={confirmFollowUpNow}
                disabled={followUpLoading}
                className="flex-1 py-2 px-4 bg-primary text-white rounded-md font-medium transition-colors disabled:opacity-80"
              >
                {followUpLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {translate("clientInfo.followUpNowRunning")}
                  </span>
                ) : (
                  translate("clientInfo.followUpNowConfirm")
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80 m-4 animate-fade-in">
            <div className="flex flex-col items-center text-center mb-4">
              <div className="bg-red-100 p-3 rounded-full mb-4">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">
                {translate("header.logoutConfirm.title")}
              </h3>
              <p className="text-gray-600 mt-2">
                {translate("header.logoutConfirm.message")}
              </p>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={cancelLogout}
                className="flex-1 py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md font-medium transition-colors"
              >
                {translate("header.logoutConfirm.cancel")}
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="flex-1 py-2 px-4 bg-red-500 text-white rounded-md font-medium transition-colors"
              >
                {translate("header.logoutConfirm.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <form
          onSubmit={handleSubmit}
          className="client-info-form flex flex-col gap-4 w-full max-w-none mx-0 p-6 bg-white rounded-lg shadow mt-6"
        >
          <label className="flex flex-col text-gray-600 mb-1">
            {t.clientInfo.shareableLink}:
            <div className="relative mt-2 flex items-center gap-2">
              <input
                type="text"
                disabled={true}
                readOnly={true}
                value={shareableLink}
                className="flex-1 p-2 pr-8 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-200"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="p-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors flex items-center justify-center"
                title={t.clientInfo.copyLink || "Copy link"}
              >
                <Copy className={`h-4 w-4 ${copied ? "text-green-600" : "text-gray-600"}`} />
              </button>
              <button
                type="button"
                onClick={handleShareLink}
                className="p-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors flex items-center justify-center"
                title={t.clientInfo.shareLink || "Share link"}
              >
                <Share2 className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          </label>

          <label className="flex flex-col text-gray-600 mb-1">
            {t.clientInfo.email}:
            <div className="relative">
              <input
                type="email"
                name="email"
                value={formData.email || ""}
                onChange={handleChange}
                disabled={true}
                className="mt-2 p-2 pr-8 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-200 w-full"
              />
            </div>
          </label>
          <div className="mb-1">
            <PhoneField
              className="w-full"
              name="phone_number"
              label={t.clientInfo.phoneNumber}
              value={formData.phone_number ?? ""}
              onChange={(next) => {
                setFormData((prev) => {
                  const updated = { ...prev, phone_number: next ?? "" };
                  const normalizedData = normalizeDataForComparison(data?.data);
                  setIsChanged(JSON.stringify(updated) !== JSON.stringify(normalizedData));
                  return updated;
                });
              }}
              defaultCountry="EG"
            />
          </div>
          <label className="flex flex-col text-gray-600 mb-1">
            {t.clientInfo.clientName}:
            <div className="relative">
              <input
                type="text"
                disabled={true}
                readOnly={true}
                value={data.data?.client_name}
                className="mt-2 p-2 pr-8 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-200 w-full"
              />
            </div>
          </label>

          <label className="flex flex-col text-gray-600 mb-1">
            {t.clientInfo.welcomeMessage}:
            <div className="relative">
              <textarea
                name="chatbot_welcome_message"
                value={formData.chatbot_welcome_message || ""}
                onChange={handleChange}
                rows={3}
                maxLength={500}
                className="mt-2 p-2 pr-8 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full resize-y"
                placeholder={t.clientInfo.welcomeMessagePlaceholder || "Enter welcome message (max 50 words)"}
              />
              <div className="text-xs text-gray-500 mt-1">
                {countWords(formData.chatbot_welcome_message || "")} / 50 {t.clientInfo.words || "words"}
              </div>
            </div>
          </label>

          <label className="flex flex-col text-gray-600 mb-1">
            {t.clientInfo.initialSuggestions}:
            <div className="relative mt-2 space-y-2">
              {(formData.chatbot_initial_suggestions || [""]).map((value, idx) => (
                <div key={idx} className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      name={`chatbot_initial_suggestions_${idx}`}
                      value={value || ""}
                      onChange={handleChange}
                      maxLength={200}
                      className="flex-1 p-2 pr-8 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder={
                        t.clientInfo.suggestionPlaceholder ||
                        "Suggested question (max 20 words)"
                      }
                    />

                    {(formData.chatbot_initial_suggestions || []).length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSuggestedQuestion(idx)}
                        className="shrink-0 h-[42px] px-3 border border-gray-300 rounded hover:bg-gray-100 transition-colors text-gray-700"
                        aria-label={t.clientInfo.removeSuggestion || "Remove"}
                        title={t.clientInfo.removeSuggestion || "Remove"}
                      >
                        {t.clientInfo.remove || "Remove"}
                      </button>
                    )}
                  </div>

                  <div className="text-xs text-gray-500">
                    {countWords(value || "")} / 20 {t.clientInfo.words || "words"}
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between pt-1">
                <div className="text-xs text-gray-500">
                  {(formData.chatbot_initial_suggestions || []).length} /{" "}
                  {MAX_SUGGESTED_QUESTIONS}
                </div>
                <button
                  type="button"
                  onClick={addSuggestedQuestion}
                  disabled={
                    (formData.chatbot_initial_suggestions || []).length >=
                    MAX_SUGGESTED_QUESTIONS
                  }
                  className="px-3 py-2 bg-gradient-to-r from-[#3926A7] to-[#21EAF4] text-white rounded-md shadow-sm transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {t.clientInfo.addSuggestion || "+ Add question"}
                </button>
              </div>
            </div>
          </label>

          <label className="flex flex-col font-medium text-gray-700 mb-2">
            {t.clientInfo.pricePercentage}:
            <div className="relative mt-1">
              <input
                type="number"
                name="price_percentage"
                step="0.01"
                min="0"
                max="100"
                value={formData.price_percentage || ""}
                onChange={handleChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pl-3 pr-8 py-2.5 text-gray-900"
                placeholder="0.00"
              />
              <div className="absolute inset-y-0 rtl:left-4 ltr:right-4 flex items-center pointer-events-none pr-3">
                <span className="text-gray-500 font-medium">%</span>
              </div>
            </div>
          </label>

          <label className="flex flex-col font-medium text-gray-700 mb-2">
            {t.clientInfo.accurateQueriesLevel}:
            <div className="mt-2 space-y-3">
              <label className="flex items-start gap-2 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                <input
                  type="radio"
                  name="accurate_queries_level"
                  value={0}
                  checked={formData.accurate_queries_level == 0}
                  onChange={handleChange}
                  className="mt-1.5 mr-3"
                />
                <div>
                  <div className="font-semibold text-gray-900">
                    {t.clientInfo.accuracyLevels.exactMatch.title}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {t.clientInfo.accuracyLevels.exactMatch.description}
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-2 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                <input
                  type="radio"
                  name="accurate_queries_level"
                  value={1}
                  checked={formData.accurate_queries_level == 1}
                  onChange={handleChange}
                  className="mt-1.5 mr-3"
                />
                <div>
                  <div className="font-semibold text-gray-900">
                    {t.clientInfo.accuracyLevels.accurate.title}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {t.clientInfo.accuracyLevels.accurate.description}
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-2 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                <input
                  type="radio"
                  name="accurate_queries_level"
                  value={2}
                  checked={formData.accurate_queries_level == 2}
                  onChange={handleChange}
                  className="mt-1.5 mr-3"
                />
                <div>
                  <div className="font-semibold text-gray-900">
                    {t.clientInfo.accuracyLevels.flexible.title}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {t.clientInfo.accuracyLevels.flexible.description}
                  </p>
                </div>
              </label>
            </div>
          </label>

          {isChanged && (
            <button
              disabled={loadingSubmit}
              className="mt-2 py-2 px-4 bg-primary text-white rounded hover:opacity-90 transition disabled:opacity-80 disabled:!cursor-auto"
            >
              {loadingSubmit ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="animate-spin" />
                  <span className="ml-2">{t.clientInfo.saving}</span>
                </div>
              ) : (
                t.clientInfo.saveChanges
              )}
            </button>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
            <AutomationAgentsSection
              enabledAgents={data?.data?.enabled_agents ?? []}
              isProfileLoading={isLoading}
            />

            <OpenwaConnectionAccess showButton buttonVariant="card" />

            <div className="rounded-lg border border-gray-200 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {translate("clientInfo.followUpNow")}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {translate("clientInfo.followUpNowDescription")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleFollowUpNow}
                  disabled={!clientId || followUpLoading}
                  className="shrink-0 inline-flex items-center justify-center gap-2 py-2 px-4 border border-red-200 bg-red-50 text-red-700 rounded-md font-medium transition-colors hover:bg-red-100 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {followUpLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                      <span>{translate("clientInfo.followUpNowRunning")}</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span>{translate("clientInfo.followUpNow")}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm font-medium text-red-600 hover:bg-red-50 py-2 px-3 rounded-md transition-colors"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>{translate("header.userMenu.logout")}</span>
            </button>
          </div>
        </form>
      )}
    </>
  );
}

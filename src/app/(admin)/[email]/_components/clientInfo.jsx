"use client";

import LoadingSpinner from "@/components/ui/loading-spinner";
import { getProfileDataByEmail, updateProfileData } from "@/utils/api";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ChevronDown, Copy, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useI18n } from "@/context/translate-api";
import Cookies from "js-cookie";

export default function ClientInfo({ client_email }) {
  const { t } = useI18n();
  const { data, isLoading } = useQuery({
    queryKey: ["clientData" + client_email],
    queryFn: () => getProfileDataByEmail(client_email),
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
    chatbot_initial_suggestions: data?.data?.chatbot_initial_suggestions || ["", ""],
  });
  const [isChanged, setIsChanged] = useState(false);
  const [copied, setCopied] = useState(false);

  // Helper function to count words
  const countWords = (text) => {
    if (!text || !text.trim()) return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  // Helper function to normalize data for comparison
  const normalizeDataForComparison = (data) => {
    if (!data) return {};
    const normalized = { ...data };
    // Normalize chatbot_initial_suggestions to array format
    if (normalized.chatbot_initial_suggestions) {
      if (Array.isArray(normalized.chatbot_initial_suggestions)) {
        normalized.chatbot_initial_suggestions = [
          normalized.chatbot_initial_suggestions[0] || "",
          normalized.chatbot_initial_suggestions[1] || "",
        ];
      } else {
        normalized.chatbot_initial_suggestions = ["", ""];
      }
    } else {
      normalized.chatbot_initial_suggestions = ["", ""];
    }
    if (!normalized.chatbot_welcome_message) {
      normalized.chatbot_welcome_message = "";
    }
    return normalized;
  };

  const clientId = Cookies.get("lena-website-client_id");
  const shareableLink = clientId ? `https://chat.lenaai.net/${clientId}` : "";

  useEffect(() => {
    const suggestions = data?.data?.chatbot_initial_suggestions || [];
    setFormData({
      phone_number: data?.data?.phone_number,
      email: data?.data?.email,
      price_percentage: data?.data?.price_percentage || 0,
      accurate_queries_level: data?.data?.accurate_queries_level || 0,
      chatbot_welcome_message: data?.data?.chatbot_welcome_message || "",
      chatbot_initial_suggestions: [
        suggestions[0] || "",
        suggestions[1] || "",
      ],
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
        toast.error(t.clientInfo.welcomeMessageWordLimit || "Welcome message cannot exceed 50 words");
        return;
      }
    }

    // Handle initial suggestions word limit (20 words each)
    if (name.startsWith("chatbot_initial_suggestions_")) {
      const index = parseInt(name.split("_")[3]);
      const wordCount = countWords(value);
      if (wordCount > 20) {
        toast.error(t.clientInfo.suggestionWordLimit || "Each suggested question cannot exceed 20 words");
        return;
      }
      setFormData((prev) => {
        const updated = {
          ...prev,
          chatbot_initial_suggestions: prev.chatbot_initial_suggestions.map((item, i) =>
            i === index ? value : item
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoadingSubmit(true);
      // Format data for API: filter out empty suggestions
      const submitData = {
        ...formData,
        chatbot_initial_suggestions: formData.chatbot_initial_suggestions.filter(
          (suggestion) => suggestion.trim().length > 0
        ),
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

  return (
    <>
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <form
          onSubmit={handleSubmit}
          className="client-info-form flex flex-col gap-4 max-w-md mx-auto p-6 bg-white rounded-lg shadow mt-6"
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
          <label className="flex flex-col text-gray-600 mb-1">
            {t.clientInfo.phoneNumber}:
            <div className="relative">
              <input
                type="text"
                name="phone_number"
                value={formData.phone_number || ""}
                onChange={handleChange}
                className="mt-2 p-2 pr-8 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full"
              />
            </div>
          </label>
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
              <div>
                <input
                  type="text"
                  name="chatbot_initial_suggestions_0"
                  value={formData.chatbot_initial_suggestions?.[0] || ""}
                  onChange={handleChange}
                  maxLength={200}
                  className="w-full p-2 pr-8 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder={t.clientInfo.suggestionPlaceholder || "First suggested question (max 20 words)"}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {countWords(formData.chatbot_initial_suggestions?.[0] || "")} / 20 {t.clientInfo.words || "words"}
                </div>
              </div>
              <div>
                <input
                  type="text"
                  name="chatbot_initial_suggestions_1"
                  value={formData.chatbot_initial_suggestions?.[1] || ""}
                  onChange={handleChange}
                  maxLength={200}
                  className="w-full p-2 pr-8 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder={t.clientInfo.suggestionPlaceholder || "Second suggested question (max 20 words)"}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {countWords(formData.chatbot_initial_suggestions?.[1] || "")} / 20 {t.clientInfo.words || "words"}
                </div>
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
        </form>
      )}
    </>
  );
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchNews } from "@/utils/api";
import { useI18n } from "@/context/translate-api";
import { Calendar, ExternalLink, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import DeleteConfirmDialog from "@/components/ui/confirm-delete-dialog";
import { axiosInstance } from "@/lib/axiosInstance";
import { IMAGE_BASE_URL } from "@/lib/apiConfig";

const resolveImageUrl = (url) => {
  if (!url) return null;
  if (Array.isArray(url)) return resolveImageUrl(url[0]);
  if (typeof url !== "string") return null;

  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return `${IMAGE_BASE_URL}${url}`;
  return `${IMAGE_BASE_URL}/${url}`;
};

const getNewsImageUrl = (item) => {
  if (!item || typeof item !== "object") return null;
  return (
    item.image_url ||
    item.imageUrl ||
    item.image ||
    item.image_path ||
    item.photo_url ||
    item.photoUrl ||
    null
  );
};

const getNewsId = (item) => {
  if (!item || typeof item !== "object") return null;
  return item.id ?? item.news_id ?? item.newsId ?? item._id ?? null;
};

const NewsFeed = () => {
  const { t, locale } = useI18n();

  const {
    data: news,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["news"],
    queryFn: fetchNews,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [mode, setMode] = useState("add"); // "add" | "edit"
  const [submitting, setSubmitting] = useState(false);

  const [selectedNews, setSelectedNews] = useState(null);

  // Form fields (curl schema compatible)
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [dateStr, setDateStr] = useState("");

  // Single-image: either an existing image URL (edit) or a newly selected File (create/edit)
  const [existingImageUrl, setExistingImageUrl] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [newsToDelete, setNewsToDelete] = useState(null);

  const previewUrl = imagePreviewUrl || existingImageUrl;

  // Create a local preview URL for the selected image file.
  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(imageFile);
    setImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const formatDate = useMemo(
    () => (dateString) => {
      if (!dateString) return "";
      try {
        const date = new Date(dateString);
        return formatDistanceToNow(date, {
          addSuffix: true,
          locale: locale === "ar" ? ar : enUS,
        });
      } catch (e) {
        return dateString;
      }
    },
    [locale]
  );

  const openAddDialog = () => {
    setMode("add");
    setSelectedNews(null);
    setTitle("");
    setDesc("");
    setSourceUrl("");
    setDateStr("");
    setExistingImageUrl(null);
    setImageFile(null);
    setImagePreviewUrl(null);
    setFormOpen(true);
  };

  const openEditDialog = (item) => {
    const imgUrl = resolveImageUrl(getNewsImageUrl(item));
    setMode("edit");
    setSelectedNews(item);

    setTitle(item?.title ?? "");
    setDesc(item?.desc ?? "");
    setSourceUrl(item?.source_url ?? "");

    // curl expects `date_str`; backend might send `created_at`.
    setDateStr(item?.date_str ?? item?.dateStr ?? item?.created_at ?? "");

    setExistingImageUrl(imgUrl);
    setImageFile(null);
    setImagePreviewUrl(null);
    setFormOpen(true);
  };

  const buildFormData = () => {
    const fd = new FormData();
    fd.append("title", title ?? "");
    fd.append("desc", desc ?? "");
    fd.append("source_url", sourceUrl ?? "");
    fd.append("date_str", dateStr ?? "");

    // curl schema: send the selected file directly as multipart field `image`.
    if (imageFile) {
      fd.append("image", imageFile);
    }

    return fd;
  };

  const createNews = async () => {
    const fd = buildFormData();
    return axiosInstance.post("/news/add", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  };

  const updateNews = async (newsId) => {
    const fd = buildFormData();
    // Backend naming is not guaranteed; we try the most common keys.
    fd.append("news_id", newsId);
    fd.append("id", newsId);

    // Try common update patterns.
    try {
      return await axiosInstance.post("/news/update", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    } catch (e1) {
      // Fallback: update with query string.
      return await axiosInstance.post(`/news/update?news_id=${encodeURIComponent(newsId)}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
  };

  // Image upload + update are handled only on submit to match the curl schema.

  const deleteNews = async (newsId) => {
    // Fallback order: params, path, JSON body.
    const attempts = [
      () =>
        axiosInstance.delete("/news/delete", {
          params: { news_id: newsId },
        }),
      () => axiosInstance.delete(`/news/delete/${newsId}`),
      () => axiosInstance.post("/news/delete", { news_id: newsId }),
    ];

    let lastError;
    for (const attempt of attempts) {
      try {
        return await attempt();
      } catch (e) {
        lastError = e;
      }
    }
    throw lastError;
  };

  const handleSelectImage = (file) => {
    setImageFile(file ?? null);
  };

  const validateForm = () => {
    const hasText = (title ?? "").trim() !== "" || (desc ?? "").trim() !== "";
    const hasImage = !!imageFile;
    return hasText || hasImage;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!validateForm()) {
      toast.error("News must include at least text (title/desc) or an image.");
      return;
    }

    try {
      setSubmitting(true);

      if (mode === "add") {
        await createNews();
        toast.success("News added successfully.");
      } else {
        const newsId = getNewsId(selectedNews);
        if (!newsId) {
          toast.error("Cannot edit: missing news id.");
          return;
        }
        await updateNews(newsId);
        toast.success("News updated successfully.");
      }

      setFormOpen(false);
      setSelectedNews(null);
      await refetch();
    } catch (err) {
      const msg =
        err?.response?.data?.error_message ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to submit news.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-gray-600">{t.loading || "Loading news..."}</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
          <p className="text-red-600 font-semibold mb-2">
            {t.error || "Error loading news"}
          </p>
          <p className="text-red-500 text-sm">
            {error?.message || "Please try again later"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t.sidebar?.news || "News"}
          </h1>
          <p className="text-gray-600">
            {t.newsSubtitle || "Latest real estate news and updates"}
          </p>
        </div>

        <button
          type="button"
          onClick={openAddDialog}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg transition-colors duration-200 hover:bg-primary-dark"
        >
          <Plus size={18} />
          <span>{t.addNews || "Add News"}</span>
        </button>
      </div>

      {!news || news.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-260px)] p-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 max-w-md text-center w-full">
            <p className="text-gray-600 text-lg mb-4">
              {t.noNews || "No news available at the moment"}
            </p>
            <button
              type="button"
              onClick={openAddDialog}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary text-white px-4 py-2 rounded-lg transition-colors duration-200 hover:bg-primary-dark"
            >
              <Plus size={18} />
              <span>{t.addNews || "Add News"}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {news.map((item, index) => {
            const imageUrl = resolveImageUrl(getNewsImageUrl(item));
            const id = getNewsId(item) ?? index;
            const dateValue = item?.created_at ?? item?.date_str ?? item?.dateStr ?? "";

            return (
              <article
                key={id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden border border-gray-200"
              >
                {imageUrl ? (
                  <div className="w-full h-44 bg-gray-50 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt={item?.title ? String(item.title) : "News image"}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                ) : null}

                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="text-xl font-semibold text-gray-900 mb-3 leading-tight break-words">
                        {item.title || ""}
                      </h2>

                      {item.desc ? (
                        <p className="text-gray-700 mb-4 leading-relaxed line-clamp-3 whitespace-pre-line">
                          {item.desc}
                        </p>
                      ) : (
                        <p className="text-gray-400 mb-4 leading-relaxed line-clamp-3">
                          {t.noDescription || "No description"}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditDialog(item)}
                        className="p-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                        aria-label="Edit news"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewsToDelete(item);
                          setShowDeleteDialog(true);
                        }}
                        className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                        aria-label="Delete news"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center text-gray-500 text-sm">
                      <Calendar className="h-4 w-4 mr-2" />
                      <time dateTime={dateValue}>{formatDate(dateValue)}</time>
                    </div>

                    {item.source_url ? (
                      <a
                        href={item.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-primary hover:text-primary-dark font-medium text-sm transition-colors group"
                      >
                        <span>{t.readMore || "Read more"}</span>
                        <ExternalLink className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </a>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {showDeleteDialog && newsToDelete ? (
        <DeleteConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={async () => {
            try {
              const newsId = getNewsId(newsToDelete);
              if (!newsId) {
                toast.error("Cannot delete: missing news id.");
                setShowDeleteDialog(false);
                return;
              }
              await deleteNews(newsId);
              toast.success("News deleted successfully.");
              setShowDeleteDialog(false);
              setNewsToDelete(null);
              await refetch();
            } catch (err) {
              const msg =
                err?.response?.data?.error_message ||
                err?.response?.data?.message ||
                err?.message ||
                "Failed to delete news.";
              toast.error(msg);
            }
          }}
          title={t.deleteNewsTitle || "Delete News"}
          message={t.deleteNewsMessage || "Are you sure you want to delete this news item?"}
          confirmLabel={t.deleteButton || "Delete"}
          cancelLabel={t.cancelButton || "Cancel"}
        />
      ) : null}

      {formOpen ? (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full overflow-hidden">
            <div className="bg-primary px-6 py-4 flex items-center justify-between gap-3">
              <h2 className="text-white text-lg font-semibold">
                {mode === "add" ? t.addNews || "Add News" : t.editNews || "Edit News"}
              </h2>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="text-white/90 hover:text-white transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-gray-700">
                      {t.title || "Title"}
                    </span>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="e.g. Market Update"
                    />
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-gray-700">
                      {t.sourceUrl || "Source URL"}
                    </span>
                    <input
                      value={sourceUrl}
                      onChange={(e) => setSourceUrl(e.target.value)}
                      className="border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="https://example.com/article"
                    />
                  </label>
                </div>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-gray-700">
                    {t.description || "Description"}
                  </span>
                  <textarea
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    rows={4}
                    className="border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Write a short news description..."
                  />
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-gray-700">
                      {t.dateStr || "Date"}
                    </span>
                    <input
                      value={dateStr}
                      onChange={(e) => setDateStr(e.target.value)}
                      className="border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="YYYY-MM-DD or ISO string"
                    />
                  </label>

                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-gray-700">Image (optional)</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple={false}
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        handleSelectImage(file);
                      }}
                      className="border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <p className="text-xs text-gray-500">
                      {t.singleImageHelp || "Only one image is allowed per news item."}
                    </p>
                  </div>
                </div>

                {previewUrl ? (
                  <div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      {t.imagePreview || "Preview"}
                    </p>
                    <div className="w-full h-56 bg-white rounded-md overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={previewUrl}
                        alt="News preview"
                        className="w-full h-full object-cover"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-gray-300 p-4 text-center text-gray-500 bg-white">
                    {t.noImageSelected || "No image selected."}
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {t.cancelButton || "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <span className="inline-block h-2 w-2 rounded-full bg-white animate-pulse" />
                      <span>{t.saving || "Saving..."}</span>
                    </>
                  ) : mode === "add" ? (
                    t.addNews || "Add"
                  ) : (
                    t.saveChanges || "Save changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default NewsFeed;


"use client";

import { useRef, useState } from "react";
import { useI18n } from "@/hooks/useI18n";
import { getClientLogoDisplayUrl } from "@/utils/imageUtils";
import {
  NETWORK_LOGO_ACCEPT,
  NETWORK_LOGO_MAX_BYTES,
  isNetworkLogoFile,
} from "@/lib/lenaqar/network-logo";
import { submitNetworkLogo } from "@/app/(lenaqar)/_actions/network-auth";

export default function NetworkLogoField({
  logoUrl,
  onLogoUrlChange,
  errorMessage,
}) {
  const { translate } = useI18n();
  const inputRef = useRef(null);
  const [preview, setPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState("");

  const displaySrc = preview || getClientLogoDisplayUrl(logoUrl) || "";
  const shownError = localError || errorMessage || "";

  const clearPreview = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview("");
  };

  const processFile = async (file) => {
    if (!file) return;
    setLocalError("");

    if (!isNetworkLogoFile(file)) {
      setLocalError(translate("lenaqar.network.signup.logoType"));
      return;
    }
    if (file.size > NETWORK_LOGO_MAX_BYTES) {
      setLocalError(translate("lenaqar.network.signup.logoTooLarge"));
      return;
    }

    clearPreview();
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await submitNetworkLogo(formData);
      if (!result?.ok || !result.url) {
        clearPreview();
        onLogoUrlChange("");
        setLocalError(
          translate(
            `lenaqar.network.signup.${result?.code || "logoFailed"}`,
            translate("lenaqar.network.signup.logoFailed"),
          ),
        );
        return;
      }
      onLogoUrlChange(result.url);
    } finally {
      setUploading(false);
    }
  };

  const removeLogo = () => {
    clearPreview();
    onLogoUrlChange("");
    setLocalError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-gray-800">
        {translate("lenaqar.network.signup.logo")}
        <span className="ms-1 font-normal text-gray-500">
          {translate("lenaqar.network.signup.logoOptional")}
        </span>
      </p>
      <input
        ref={inputRef}
        type="file"
        accept={NETWORK_LOGO_ACCEPT}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          processFile(file);
          event.target.value = "";
        }}
      />
      {displaySrc ? (
        <div className="relative h-28 w-28 overflow-hidden rounded-xl border border-primary/15 bg-white">
          {/* Native img: GCS hosts are not always in next/image remotePatterns. */}
          <img
            src={displaySrc}
            alt=""
            className="h-full w-full object-cover"
          />
          {uploading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-semibold text-white">
              {translate("common.saving")}
            </div>
          ) : (
            <button
              type="button"
              onClick={removeLogo}
              className="absolute top-1 end-1 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white text-sm"
              aria-label={translate("lenaqar.network.signup.logoRemove")}
            >
              ×
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-28 w-28 flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/25 bg-primary/[0.03] text-center text-xs font-medium text-primary hover:bg-primary/[0.06]"
        >
          {uploading
            ? translate("common.saving")
            : translate("lenaqar.network.signup.logoAdd")}
        </button>
      )}
      <p className="mt-2 text-xs text-gray-500">
        {translate("lenaqar.network.signup.logoHint")}
      </p>
      {shownError ? (
        <p role="alert" className="mt-1.5 text-xs text-red-600">
          {shownError}
        </p>
      ) : null}
    </div>
  );
}

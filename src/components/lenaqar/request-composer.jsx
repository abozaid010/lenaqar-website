"use client";

import { forwardRef, useCallback, useEffect, useId, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ClipboardList, MessageCircle } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics";
import { ANALYTICS } from "@/constants/analytics";
import { trackWhatsAppClick } from "@/lib/analytics";
import { formatPhoneForWhatsApp } from "@/utils/phone-utils";
import { LENAQAR_CONTACT } from "@/config/lenaqar-contact";
import {
  REQUEST_TEXT_MAX,
  prefillFromRequestText,
  validateRequestText,
} from "@/lib/lenaqar/request-text-prefill";
import { actionButtonClass } from "@/components/ui/action-button-class";
import BuyRequestCta from "./buy-request-cta";

/**
 * Homepage request box.
 *
 * Primary: SEND opens WhatsApp in one click with the request already written.
 * Secondary: "fill a short form" opens the existing API-backed buy-request
 * dialog, pre-filled from the same text (location, budget and contact are
 * confirmed there).
 */
const RequestComposer = forwardRef(function RequestComposer(
  { className = "", autoFocus = false, labelAside = null },
  textareaRef,
) {
  const { translate } = useI18n();
  const { trackEvent } = useGoogleAnalytics();
  const fieldId = useId();
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [prefill, setPrefill] = useState(null);
  const [success, setSuccess] = useState(null);
  const [sentHref, setSentHref] = useState("");

  const t = (key) => translate(`lenaqar.onboarding.${key}`);

  // Mount-time focus (the parent decides: explicit skip or a desktop pointer).
  useEffect(() => {
    if (autoFocus) textareaRef?.current?.focus?.({ preventScroll: true });
  }, [autoFocus, textareaRef]);

  const errorText = (code) => {
    if (code === "empty") return t("errorEmpty");
    if (code === "short") return t("errorShort");
    if (code === "long") return t("errorLong").replace("{max}", String(REQUEST_TEXT_MAX));
    return "";
  };

  const validate = () => {
    const code = validateRequestText(text);
    setError(code);
    if (code) textareaRef?.current?.focus?.();
    return !code;
  };

  const whatsappHref = () =>
    formatPhoneForWhatsApp(
      LENAQAR_CONTACT.whatsappE164,
      `${t("whatsappIntro")}\n\n${text.trim()}`,
    );

  // Primary: straight to WhatsApp with the message ready.
  const handleWhatsApp = (event) => {
    event?.preventDefault?.();
    if (!validate()) return;
    const href = whatsappHref();
    trackWhatsAppClick({ intent: "buy", location: "home_composer" });
    setSentHref(href);
    // New tab keeps the site open on desktop; phones hand off to the app.
    // If a popup blocker refuses, fall back to the same tab.
    const opened = window.open(href, "_blank");
    if (opened) opened.opener = null;
    else window.location.assign(href);
  };

  // Secondary: the existing form, pre-filled from the text.
  const handleForm = () => {
    if (!validate()) return;
    setPrefill(prefillFromRequestText(text));
    trackEvent(ANALYTICS.EVENTS.BUY_REQUEST_OPENED, { cta_location: "home_composer" });
    setDialogOpen(true);
  };

  const handleOpenChange = useCallback((next) => setDialogOpen(next), []);

  const handleSubmitted = useCallback(({ opportunitiesHref }) => {
    setSuccess({ opportunitiesHref });
    setText("");
    setPrefill(null);
    setError("");
    setSentHref("");
  }, []);

  const length = text.trim().length;
  const describedBy = `${fieldId}-hint${error ? ` ${fieldId}-error` : ""}`;

  if (success) {
    return (
      <div
        role="status"
        className={`rounded-3xl border border-emerald-200 bg-emerald-50/70 p-5 text-center sm:p-6 ${className}`}
      >
        <CheckCircle2 aria-hidden="true" className="mx-auto size-9 text-emerald-600" />
        <p className="mt-2 text-lg font-bold text-primary">{t("successTitle")}</p>
        <p className="mt-1 text-sm text-black/70 sm:text-base">{t("successBody")}</p>
        <div className="mt-4 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
          <Link
            href={success.opportunitiesHref}
            className={actionButtonClass({ variant: "primary" })}
          >
            {t("successMatches")}
          </Link>
          <button
            type="button"
            onClick={() => setSuccess(null)}
            className={actionButtonClass({ variant: "secondary" })}
          >
            {t("successAnother")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleWhatsApp} noValidate className={`w-full ${className}`}>
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <label htmlFor={fieldId} className="text-sm font-semibold text-primary">
            {t("composerLabel")}
          </label>
          {labelAside}
        </div>
        <div
          className={`rounded-2xl border bg-white shadow-[0_20px_50px_-30px_rgba(3,2,80,0.45)] transition-colors focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 sm:rounded-3xl ${
            error ? "border-red-400" : "border-primary/20"
          }`}
        >
          <textarea
            ref={textareaRef}
            id={fieldId}
            name="request"
            dir="auto"
            rows={3}
            value={text}
            maxLength={REQUEST_TEXT_MAX + 200}
            onChange={(event) => {
              setText(event.target.value);
              if (error) setError("");
              if (sentHref) setSentHref("");
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                handleWhatsApp(event);
              }
            }}
            placeholder={t("composerPlaceholder")}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className="block min-h-[5.25rem] w-full resize-none rounded-t-2xl bg-transparent px-4 pt-3 pb-1 text-start text-base leading-relaxed text-black placeholder:text-black/40 focus:outline-none sm:min-h-[5.5rem] sm:rounded-t-3xl sm:px-5 sm:pt-4 sm:text-lg"
          />
          <div className="flex items-center justify-between gap-3 px-2.5 pb-2.5 sm:px-3.5 sm:pb-3">
            <span
              dir="ltr"
              aria-hidden="true"
              className={`ps-2 text-xs tabular-nums ${
                length > REQUEST_TEXT_MAX ? "text-red-600" : "text-black/40"
              }`}
            >
              {t("counter")
                .replace("{count}", String(length))
                .replace("{max}", String(REQUEST_TEXT_MAX))}
            </span>
            <button
              type="submit"
              className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 text-base font-bold text-white shadow-lg shadow-[#25D366]/30 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#20BA5A] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]/50 focus-visible:ring-offset-2 sm:min-h-12 sm:px-6"
            >
              <MessageCircle aria-hidden="true" className="size-5" />
              {t("send")}
            </button>
          </div>
        </div>

        {error ? (
          <p id={`${fieldId}-error`} role="alert" className="mt-1.5 text-sm font-medium text-red-600">
            {errorText(error)}
          </p>
        ) : null}

        {sentHref ? (
          <p role="status" className="mt-1.5 text-sm text-emerald-700">
            {t("sentNote")}{" "}
            <a
              href={sentHref}
              target="_blank"
              rel="noopener noreferrer"
              data-cta-intent="buy"
              data-cta-location="home_composer_resend"
              className="font-semibold underline underline-offset-4"
            >
              {t("sentRetry")}
            </a>
          </p>
        ) : null}

        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
          {/* Visually hidden on phones (the button already says WhatsApp); kept for screen readers. */}
          <p id={`${fieldId}-hint`} className="sr-only text-sm text-black/55 sm:not-sr-only">
            {t("whatsappHint")}
          </p>
          <button
            type="button"
            onClick={handleForm}
            className="compact-btn inline-flex shrink-0 items-center gap-1.5 rounded-md text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <ClipboardList aria-hidden="true" className="size-4" />
            {t("formOption")}
          </button>
        </div>
      </form>

      <BuyRequestCta
        trackingLocation="home_composer"
        hideTrigger
        open={dialogOpen}
        onOpenChange={handleOpenChange}
        prefill={prefill}
        onSubmitted={handleSubmitted}
      />
    </>
  );
});

export default RequestComposer;

"use client";

import { forwardRef, useCallback, useEffect, useId, useState } from "react";
import Link from "next/link";
import { CheckCircle2, MessageCircle, SendHorizontal } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics";
import { ANALYTICS } from "@/constants/analytics";
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
 * Homepage request box. SEND opens the existing public buy-request dialog
 * (the only API-backed submission path) pre-filled from the free text; the
 * buyer confirms location, budget and contact there. WhatsApp is the
 * zero-form alternative with the same text.
 */
const RequestComposer = forwardRef(function RequestComposer(
  { className = "", autoFocus = false },
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

  // Mount-time focus (the parent decides: explicit skip or a desktop pointer).
  useEffect(() => {
    if (autoFocus) textareaRef?.current?.focus?.({ preventScroll: true });
  }, [autoFocus, textareaRef]);

  const errorText = (code) => {
    if (code === "empty") return translate("lenaqar.onboarding.errorEmpty");
    if (code === "short") return translate("lenaqar.onboarding.errorShort");
    if (code === "long") {
      return translate("lenaqar.onboarding.errorLong").replace(
        "{max}",
        String(REQUEST_TEXT_MAX),
      );
    }
    return "";
  };

  const validate = () => {
    const code = validateRequestText(text);
    setError(code);
    if (code) textareaRef?.current?.focus?.();
    return !code;
  };

  const handleSubmit = (event) => {
    event?.preventDefault?.();
    if (!validate()) return;
    setPrefill(prefillFromRequestText(text));
    trackEvent(ANALYTICS.EVENTS.BUY_REQUEST_OPENED);
    setDialogOpen(true);
  };

  const handleOpenChange = useCallback((next) => setDialogOpen(next), []);

  const handleSubmitted = useCallback(({ opportunitiesHref }) => {
    setSuccess({ opportunitiesHref });
    setText("");
    setPrefill(null);
    setError("");
  }, []);

  const whatsappHref = formatPhoneForWhatsApp(
    LENAQAR_CONTACT.whatsappE164,
    `${translate("lenaqar.onboarding.whatsappIntro")}\n\n${text.trim()}`,
  );

  const length = text.trim().length;
  const describedBy = `${fieldId}-hint${error ? ` ${fieldId}-error` : ""}`;

  if (success) {
    return (
      <div
        role="status"
        className={`rounded-3xl border border-emerald-200 bg-emerald-50/70 p-6 text-center sm:p-8 ${className}`}
      >
        <CheckCircle2 aria-hidden="true" className="mx-auto size-10 text-emerald-600" />
        <p className="mt-3 text-xl font-bold text-primary">
          {translate("lenaqar.onboarding.successTitle")}
        </p>
        <p className="mt-1.5 text-base text-black/70">
          {translate("lenaqar.onboarding.successBody")}
        </p>
        <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={success.opportunitiesHref}
            className={actionButtonClass({ variant: "primary" })}
          >
            {translate("lenaqar.onboarding.successMatches")}
          </Link>
          <button
            type="button"
            onClick={() => setSuccess(null)}
            className={actionButtonClass({ variant: "secondary" })}
          >
            {translate("lenaqar.onboarding.successAnother")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} noValidate className={`w-full ${className}`}>
        <label
          htmlFor={fieldId}
          className="mb-2 block text-sm font-semibold text-primary"
        >
          {translate("lenaqar.onboarding.composerLabel")}
        </label>
        <div
          className={`rounded-3xl border bg-white shadow-[0_24px_60px_-32px_rgba(3,2,80,0.45)] transition-colors focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 ${
            error ? "border-red-400" : "border-primary/20"
          }`}
        >
          <textarea
            ref={textareaRef}
            id={fieldId}
            name="request"
            dir="auto"
            rows={4}
            value={text}
            maxLength={REQUEST_TEXT_MAX + 200}
            onChange={(event) => {
              setText(event.target.value);
              if (error) setError("");
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                handleSubmit(event);
              }
            }}
            placeholder={translate("lenaqar.onboarding.composerPlaceholder")}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className="block min-h-[8.5rem] w-full resize-none rounded-t-3xl bg-transparent px-5 pt-4 pb-2 text-start text-base leading-relaxed text-black placeholder:text-black/40 focus:outline-none sm:text-lg"
          />
          <div className="flex items-center justify-between gap-3 px-3 pb-3 sm:px-4">
            <span
              dir="ltr"
              className={`ps-2 text-xs tabular-nums ${
                length > REQUEST_TEXT_MAX ? "text-red-600" : "text-black/40"
              }`}
              aria-hidden="true"
            >
              {translate("lenaqar.onboarding.counter")
                .replace("{count}", String(length))
                .replace("{max}", String(REQUEST_TEXT_MAX))}
            </span>
            <button
              type="submit"
              className={actionButtonClass({
                variant: "primary",
                size: "large",
                className: "!min-h-12 !px-6 !py-3",
              })}
            >
              {translate("lenaqar.onboarding.send")}
              <SendHorizontal aria-hidden="true" className="size-5 rtl:-scale-x-100" />
            </button>
          </div>
        </div>

        {error ? (
          <p
            id={`${fieldId}-error`}
            role="alert"
            className="mt-2 text-sm font-medium text-red-600"
          >
            {errorText(error)}
          </p>
        ) : null}

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p id={`${fieldId}-hint`} className="text-sm text-black/55">
            {translate("lenaqar.onboarding.nextStepHint")}
          </p>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => {
              if (!validate()) {
                event.preventDefault();
                return;
              }
              trackEvent(ANALYTICS.EVENTS.BUYER_WHATSAPP_CLICKED);
            }}
            className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-emerald-700 underline-offset-4 hover:underline"
          >
            <MessageCircle aria-hidden="true" className="size-4" />
            {translate("lenaqar.onboarding.sendWhatsApp")}
          </a>
        </div>
      </form>

      <BuyRequestCta
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

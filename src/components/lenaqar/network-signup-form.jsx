"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { useI18n } from "@/hooks/useI18n";
import LenaTextField from "@/components/ui/inputs/lena-text-field";
import { PhoneField } from "@/components/phone/PhoneField";
import SubmitWhatsAppFallback from "@/components/lenaqar/submit-whatsapp-fallback";
import { submitNetworkSignup } from "@/app/(lenaqar)/_actions/network-auth";
import { actionButtonClass } from "@/components/ui/action-button-class";
import { buildNetworkSignupPayload } from "@/lib/lenaqar/network-signup-payload";
import {
  composeNetworkSignupWhatsAppMessage,
  hasCompleteNetworkSignupSnapshot,
  networkActivationHref,
  saveNetworkSignupSnapshot,
  shouldFallbackNetworkSignupToWhatsApp,
  toNetworkSignupSnapshot,
} from "@/lib/lenaqar/network-activation";

const EMPTY = {
  client_name: "",
  full_name: "",
  email: "",
  password: "",
};

export default function NetworkSignupForm() {
  const { translate } = useI18n();
  const router = useRouter();
  const [form, setForm] = useState(EMPTY);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phonePayload, setPhonePayload] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [whatsappFallbackHrefState, setWhatsappFallbackHrefState] = useState("");

  const setField = (name) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const fieldError = (key) =>
    fieldErrors[key]
      ? translate(`lenaqar.network.signup.errors.${fieldErrors[key]}`)
      : "";

  const buildWhatsAppHref = (snapshot) => {
    const message = composeNetworkSignupWhatsAppMessage({
      form: snapshot,
      intro: translate("lenaqar.network.signup.whatsappFallbackIntro"),
      labels: {
        clientName: translate("lenaqar.network.signup.clientName"),
        fullName: translate("lenaqar.network.signup.fullName"),
        email: translate("lenaqar.network.signup.email"),
        phone: translate("lenaqar.network.signup.phone"),
      },
    });
    return networkActivationHref(message);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;

    if (!phonePayload?.combined) {
      toast.error(translate("lenaqar.network.signup.errors.phoneRequired"));
      return;
    }

    const input = {
      client_name: form.client_name,
      full_name: form.full_name,
      email: form.email,
      password: form.password,
      phone_number: phonePayload.combined,
      logo_url: "",
    };

    // Client-side validation first — incomplete forms stay on the page (no WhatsApp).
    const built = buildNetworkSignupPayload(input);
    if (!built.ok) {
      setFieldErrors(built.errors);
      setWhatsappFallbackHrefState("");
      toast.error(
        translate(
          "lenaqar.network.signup.errors.validation_failed",
          translate("lenaqar.network.signup.errors.save_failed"),
        ),
      );
      return;
    }

    const snapshot = toNetworkSignupSnapshot(input);

    setSaving(true);
    setWhatsappFallbackHrefState("");
    try {
      const result = await submitNetworkSignup(input);
      if (!result?.ok) {
        if (result?.errors) setFieldErrors(result.errors);
        toast.error(
          translate(
            `lenaqar.network.signup.errors.${result?.code || "save_failed"}`,
            translate("lenaqar.network.signup.errors.save_failed"),
          ),
        );

        // Frontend-only WhatsApp fallback when HTTP signup fails and payload is complete.
        // Never falls back for email_taken (login instead). Backend never sends WhatsApp.
        if (
          shouldFallbackNetworkSignupToWhatsApp(result?.code || "save_failed") &&
          hasCompleteNetworkSignupSnapshot(snapshot)
        ) {
          setWhatsappFallbackHrefState(buildWhatsAppHref(snapshot));
        }
        return;
      }

      saveNetworkSignupSnapshot(snapshot);
      router.push("/network/pending");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {whatsappFallbackHrefState ? (
        <SubmitWhatsAppFallback
          href={whatsappFallbackHrefState}
          title={translate("lenaqar.network.signup.saveFailedTitle")}
          body={translate("lenaqar.network.signup.saveFailedWhatsAppBody")}
          countdownLabel={translate(
            "lenaqar.network.signup.saveFailedWhatsAppCountdown",
          )}
          ctaLabel={translate("lenaqar.network.signup.saveFailedWhatsAppCta")}
        />
      ) : null}

      <LenaTextField
        name="client_name"
        label={translate("lenaqar.network.signup.clientName")}
        value={form.client_name}
        onChange={setField("client_name")}
        dir="rtl"
        required
        error={Boolean(fieldError("client_name"))}
        errorMessage={fieldError("client_name")}
      />
      <LenaTextField
        name="full_name"
        label={translate("lenaqar.network.signup.fullName")}
        value={form.full_name}
        onChange={setField("full_name")}
        dir="rtl"
        required
        error={Boolean(fieldError("full_name"))}
        errorMessage={fieldError("full_name")}
      />
      <LenaTextField
        name="email"
        type="email"
        autoComplete="email"
        label={translate("lenaqar.network.signup.email")}
        value={form.email}
        onChange={setField("email")}
        dir="ltr"
        required
        error={Boolean(fieldError("email"))}
        errorMessage={fieldError("email")}
      />
      <LenaTextField
        name="password"
        type="password"
        autoComplete="new-password"
        label={translate("lenaqar.network.signup.password")}
        value={form.password}
        onChange={setField("password")}
        dir="ltr"
        required
        helperText={translate("lenaqar.network.signup.passwordHint")}
        error={Boolean(fieldError("password"))}
        errorMessage={fieldError("password")}
      />
      <PhoneField
        name="phone_number"
        label={translate("lenaqar.network.signup.phone")}
        required
        defaultCountry="EG"
        value={phoneNumber}
        onChange={(next) => setPhoneNumber(next ?? "")}
        onValueChange={setPhonePayload}
        error={fieldError("phone_number")}
      />

      <button
        type="submit"
        disabled={saving}
        className={`${actionButtonClass({ variant: "primary" })} w-full`}
      >
        {saving
          ? translate("lenaqar.network.signup.sending")
          : translate("lenaqar.network.signup.submit")}
      </button>

      <p className="text-center text-sm text-black/65">
        {translate("lenaqar.network.signup.hasAccount")}{" "}
        <Link href="/network/login" className="font-semibold text-primary underline">
          {translate("lenaqar.network.landing.loginCta")}
        </Link>
      </p>
    </form>
  );
}

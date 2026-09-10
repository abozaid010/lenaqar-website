"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { useI18n } from "@/hooks/useI18n";
import LenaTextField from "@/components/ui/inputs/lena-text-field";
import { PhoneField } from "@/components/phone/PhoneField";
import NetworkLogoField from "@/components/lenaqar/network-logo-field";
import { submitNetworkSignup } from "@/app/(lenaqar)/_actions/network-auth";
import { actionButtonClass } from "@/components/ui/action-button-class";
import { saveNetworkActivationName } from "@/lib/lenaqar/network-activation";

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
  const [logoUrl, setLogoUrl] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;

    if (!phonePayload?.combined) {
      toast.error(translate("lenaqar.network.signup.errors.phoneRequired"));
      return;
    }

    setSaving(true);
    try {
      const result = await submitNetworkSignup({
        client_name: form.client_name,
        full_name: form.full_name,
        email: form.email,
        password: form.password,
        phone_number: phonePayload.combined,
        logo_url: logoUrl,
      });
      if (!result?.ok) {
        if (result?.errors) setFieldErrors(result.errors);
        toast.error(
          translate(
            `lenaqar.network.signup.errors.${result?.code || "save_failed"}`,
            translate("lenaqar.network.signup.errors.save_failed"),
          ),
        );
        return;
      }
      saveNetworkActivationName(form.full_name);
      router.push("/network/pending");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
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
      <NetworkLogoField logoUrl={logoUrl} onLogoUrlChange={setLogoUrl} />

      <button
        type="submit"
        disabled={saving}
        className={`${actionButtonClass({ variant: "primary" })} w-full`}
      >
        {saving
          ? translate("common.saving")
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

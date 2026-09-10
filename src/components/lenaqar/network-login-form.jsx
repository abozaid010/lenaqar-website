"use client";

import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";
import { useI18n } from "@/hooks/useI18n";
import { SITE } from "@/config/site";
import LenaTextField from "@/components/ui/inputs/lena-text-field";
import { submitNetworkLogin } from "@/app/(lenaqar)/_actions/network-auth";
import { actionButtonClass } from "@/components/ui/action-button-class";
import NetworkActivationWhatsApp from "@/components/lenaqar/network-activation-whatsapp";
import { saveNetworkActivationName } from "@/lib/lenaqar/network-activation";

export default function NetworkLoginForm() {
  const { translate } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [pending, setPending] = useState(false);
  const [active, setActive] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;
    setPending(false);
    setActive(false);
    setSaving(true);
    try {
      const result = await submitNetworkLogin({ email, password });
      if (result?.ok) {
        setActive(true);
        return;
      }
      if (result?.code === "pending") {
        saveNetworkActivationName(email);
        setPending(true);
        return;
      }
      toast.error(
        translate(
          `lenaqar.network.login.errors.${result?.code || "failed"}`,
          translate("lenaqar.network.login.errors.invalid_credentials"),
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  if (active) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <h2 className="text-lg font-bold text-emerald-950">
          {translate("lenaqar.network.login.activeTitle")}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-emerald-900/80">
          {translate("lenaqar.network.login.activeBody")}
        </p>
        <a
          href={SITE.crmUrl}
          className={`${actionButtonClass({ variant: "primary" })} mt-4`}
        >
          {translate("lenaqar.network.login.crmCta")}
        </a>
      </div>
    );
  }

  if (pending) {
    return (
      <div className="rounded-2xl border border-primary/10 bg-primary/[0.04] p-5">
        <h2 className="text-lg font-bold text-primary">
          {translate("lenaqar.network.pending.title")}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-black/70">
          {translate("lenaqar.network.pending.body")}
        </p>
        <NetworkActivationWhatsApp name={email} />
        <Link
          href="/network"
          className={`${actionButtonClass({ variant: "secondary" })} mt-4`}
        >
          {translate("lenaqar.network.pending.back")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <LenaTextField
        name="email"
        type="email"
        autoComplete="username"
        label={translate("lenaqar.network.signup.email")}
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        dir="ltr"
        required
      />
      <LenaTextField
        name="password"
        type="password"
        autoComplete="current-password"
        label={translate("lenaqar.network.signup.password")}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        dir="ltr"
        required
      />
      <button
        type="submit"
        disabled={saving}
        className={`${actionButtonClass({ variant: "primary" })} w-full`}
      >
        {saving
          ? translate("common.saving")
          : translate("lenaqar.network.login.submit")}
      </button>
      <p className="text-center text-sm text-black/65">
        {translate("lenaqar.network.login.noAccount")}{" "}
        <Link href="/network/signup" className="font-semibold text-primary underline">
          {translate("lenaqar.header.joinNetwork")}
        </Link>
      </p>
    </form>
  );
}

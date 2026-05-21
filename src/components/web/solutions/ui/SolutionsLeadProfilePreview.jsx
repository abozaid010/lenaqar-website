"use client";

import { useI18n } from "@/hooks/useI18n";
import {
  Building2,
  Calendar,
  CreditCard,
  Mail,
  MapPin,
  Phone,
  Ruler,
  User,
} from "lucide-react";

function MetricCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-slate-500 mb-2">
        <Icon className="h-4 w-4 shrink-0 text-primary/70" aria-hidden />
        <span className="text-xs font-semibold uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="text-base md:text-lg font-bold text-slate-900">{value}</p>
      {hint ? (
        <p className="mt-1 text-xs text-slate-500 leading-snug">{hint}</p>
      ) : null}
    </div>
  );
}

function ContactRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 min-w-0">
      <Icon className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" aria-hidden />
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-medium text-slate-800 truncate">{value}</p>
      </div>
    </div>
  );
}

export default function SolutionsLeadProfilePreview({ translationRoot }) {
  const { translate } = useI18n();
  const tk = (path) => `${translationRoot}.${path}`;

  const preferences = Array.from({ length: 4 }, (_, i) =>
    translate(tk(`sample.preferences.item${i + 1}`))
  );

  return (
    <section className="py-16 md:py-24 bg-slate-50 border-y border-slate-100">
      <div className="container max-w-4xl">
        <div className="text-center mb-10 md:mb-12">
          <h2 className="text-2xl md:text-4xl font-bold text-primary leading-tight">
            {translate(tk("sectionTitle"))}
          </h2>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {translate(tk("subtitle"))}
          </p>
        </div>

        <div
          className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl shadow-primary/5 overflow-hidden"
          aria-label={translate(tk("cardAriaLabel"))}
        >
          <div className="bg-primary px-5 py-5 text-white">
            <div className="flex items-start gap-4">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/15 text-lg font-bold ring-2 ring-white/25"
                aria-hidden
              >
                {translate(tk("sample.initials"))}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold truncate">
                    {translate(tk("sample.name"))}
                  </h3>
                  <span className="inline-flex items-center rounded-full bg-[#21EAF4]/20 px-2.5 py-0.5 text-xs font-semibold text-[#21EAF4] border border-[#21EAF4]/30">
                    {translate(tk("sample.status"))}
                  </span>
                </div>
                <p className="mt-1 text-sm text-blue-100/90">
                  {translate(tk("requirementsTitle"))}
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 md:p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 border border-slate-100">
              <ContactRow
                icon={Phone}
                label={translate(tk("labels.phone"))}
                value={translate(tk("sample.phone"))}
              />
              <ContactRow
                icon={Mail}
                label={translate(tk("labels.email"))}
                value={translate(tk("sample.email"))}
              />
              <ContactRow
                icon={Building2}
                label={translate(tk("labels.company"))}
                value={translate(tk("sample.company"))}
              />
              <ContactRow
                icon={User}
                label={translate(tk("labels.propertyType"))}
                value={translate(tk("sample.propertyType"))}
              />
            </div>

            <div className="rounded-xl bg-primary text-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-200/90 mb-1">
                {translate(tk("labels.requirement"))}
              </p>
              <p className="text-xl font-bold leading-snug">
                {translate(tk("sample.unitRequired"))}
              </p>
              <p className="mt-2 text-sm text-blue-100/90 leading-relaxed">
                {translate(tk("sample.unitDescription"))}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <MetricCard
                icon={Calendar}
                label={translate(tk("labels.delivery"))}
                value={translate(tk("sample.delivery.value"))}
                hint={translate(tk("sample.delivery.hint"))}
              />
              <MetricCard
                icon={Ruler}
                label={translate(tk("labels.area"))}
                value={translate(tk("sample.area.value"))}
                hint={translate(tk("sample.area.hint"))}
              />
              <MetricCard
                icon={CreditCard}
                label={translate(tk("labels.monthlyInstallment"))}
                value={translate(tk("sample.monthly.value"))}
                hint={translate(tk("sample.monthly.hint"))}
              />
              <MetricCard
                icon={CreditCard}
                label={translate(tk("labels.budget"))}
                value={translate(tk("sample.budget.value"))}
                hint={translate(tk("sample.budget.hint"))}
              />
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-4 w-4 text-primary shrink-0" aria-hidden />
                <p className="font-semibold text-slate-900 text-sm">
                  {translate(tk("sample.preferencesTitle"))}
                </p>
              </div>
              <ul className="space-y-2">
                {preferences.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm text-slate-700 leading-relaxed"
                  >
                    <span
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                      aria-hidden
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
          {translate(tk("footnote"))}
        </p>
      </div>
    </section>
  );
}

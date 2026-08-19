"use client";

import Link from "next/link";
import { Check, X } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";

const ROWS = ["price", "numbers", "process", "commission", "exit"];

export default function WhyUsBlock() {
  const { translate } = useI18n();

  return (
    <section className="bg-black/[0.02] border-y border-black/5">
      <div className="container py-10 sm:py-14">
        <h2 className="text-2xl sm:text-3xl font-bold text-primary">
          {translate("lenaqar.whyUs.title")}
        </h2>
        <p className="mt-2 text-base text-black/60 max-w-2xl">
          {translate("lenaqar.whyUs.sub")}
        </p>

        <div className="mt-6 overflow-x-auto rounded-xl border border-black/10 bg-white">
          <table className="w-full min-w-[560px] border-collapse">
            <thead>
              <tr>
                <th className="border-b border-black/10" />
                <th
                  scope="col"
                  className="px-4 py-3 text-sm font-semibold text-black/55 text-center border-b border-black/10"
                >
                  {translate("lenaqar.whyUs.ordinaryColumn")}
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-sm font-bold text-white text-center bg-primary"
                >
                  {translate("lenaqar.whyUs.lenaqarColumn")}
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, index) => (
                <tr
                  key={row}
                  className={index % 2 === 1 ? "bg-black/[0.02]" : undefined}
                >
                  <th
                    scope="row"
                    className="px-4 py-4 text-sm font-bold text-primary text-start align-top whitespace-nowrap"
                  >
                    {translate(`lenaqar.whyUs.${row}Label`)}
                  </th>
                  <td className="px-4 py-4 text-sm text-black/60 align-top">
                    <span className="flex items-start gap-2">
                      <X
                        className="size-4 shrink-0 mt-0.5 text-red-500"
                        aria-hidden="true"
                      />
                      {translate(`lenaqar.whyUs.${row}Ordinary`)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-black/85 align-top bg-primary/[0.04]">
                    <span className="flex items-start gap-2">
                      <Check
                        className="size-4 shrink-0 mt-0.5 text-emerald-600"
                        aria-hidden="true"
                      />
                      {translate(`lenaqar.whyUs.${row}Lenaqar`)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs text-black/50">
          <Link href="/privacy" className="underline-offset-2 hover:underline">
            {translate("lenaqar.whyUs.terms")}
          </Link>
        </p>
      </div>
    </section>
  );
}

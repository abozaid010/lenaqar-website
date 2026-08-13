"use client";

import { useI18n } from "@/hooks/useI18n";
import ExitCalculator from "@/components/lenaqar/exit-calculator";

export default function CalculatorPageContent() {
  const { translate } = useI18n();

  return (
    <section className="container py-12 pb-24 lg:pb-12">
      <h1 className="text-3xl font-bold text-primary leading-snug">
        {translate("lenaqar.calculator.title")}
      </h1>
      <p className="mt-4 mb-8 text-black/70 max-w-2xl">
        {translate("lenaqar.calculator.sub")}
      </p>
      <ExitCalculator />
    </section>
  );
}

"use client";

import GlassCard from "./GlassCard";

export default function FeatureCard({ icon: Icon, title, description }) {
  return (
    <GlassCard className="p-6 h-full">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      {description ? (
        <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
      ) : null}
    </GlassCard>
  );
}

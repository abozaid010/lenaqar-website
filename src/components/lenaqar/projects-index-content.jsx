"use client";

import Link from "next/link";
import { useI18n } from "@/hooks/useI18n";
import { formatDate } from "@/lib/units/unit-formatters";
import EgpAmount from "./egp-amount";

function fill(template, values) {
  return Object.entries(values).reduce(
    (out, [key, value]) => out.replace(`{${key}}`, String(value)),
    String(template || ""),
  );
}

/** Index of developer projects that have a price summary, grouped by city. */
export default function ProjectsIndexContent({ groups = [], generatedAt }) {
  const { translate } = useI18n();
  const projects = groups.reduce((sum, group) => sum + group.projects.length, 0);
  const units = groups.reduce((sum, group) => sum + group.units, 0);
  const dateLabel = formatDate(generatedAt, "ar");

  return (
    <div className="container py-10 sm:py-14 pb-24 lg:pb-14 space-y-10">
      <header className="max-w-3xl space-y-4">
        <h1 className="text-3xl sm:text-4xl font-bold text-primary leading-snug">
          {translate("lenaqar.projects.indexTitle")}
        </h1>
        <p className="text-base sm:text-lg text-black/75 leading-relaxed">
          {translate("lenaqar.projects.indexIntro")}
        </p>
        {projects > 0 && dateLabel ? (
          <p className="text-sm text-black/60">
            <time dateTime={generatedAt}>
              {fill(translate("lenaqar.projects.indexCount"), {
                projects,
                units,
                date: dateLabel,
              })}
            </time>
          </p>
        ) : null}
      </header>

      {groups.map((group) => (
        <section key={group.city} className="border-t border-black/10 pt-6">
          <h2 className="text-xl sm:text-2xl font-bold text-primary">{group.city}</h2>
          <p className="mt-1 text-sm text-black/60">
            {fill(translate("lenaqar.projects.cityCount"), {
              projects: group.projects.length,
              units: group.units,
            })}
          </p>
          <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {group.projects.map((project) => (
              <li key={project.slug}>
                <Link
                  href={`/projects/${project.slug}`}
                  className="block h-full rounded-xl border border-primary/10 bg-white px-4 py-3 hover:bg-primary/5"
                >
                  <span className="block font-semibold text-primary">{project.name}</span>
                  <span className="mt-1 block text-sm text-black/70">
                    {[project.developer, project.district].filter(Boolean).join(" · ")}
                  </span>
                  <span className="mt-1 block text-sm text-black/80">
                    {fill(translate("lenaqar.projects.unitsShort"), { count: project.units })}
                    {" · "}
                    {translate("lenaqar.projects.from")}{" "}
                    <EgpAmount value={project.priceMin} translate={translate} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

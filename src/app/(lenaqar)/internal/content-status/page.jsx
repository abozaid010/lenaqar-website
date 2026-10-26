import { notFound } from "next/navigation";
import { getEditorialRows } from "@/lib/guides/load";
import { isPreviewAuthorized } from "@/lib/guides/preview-auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "حالة محتوى دليل المشتري",
  robots: { index: false, follow: false, nocache: true },
};

export default async function ContentStatusPage({ searchParams }) {
  const sp = await searchParams;
  if (!isPreviewAuthorized(sp?.token)) notFound();

  const rows = getEditorialRows();

  return (
    <div className="container py-10 max-w-5xl space-y-6 pb-20">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-primary">
          لوحة حالة المحتوى — دليل المشتري
        </h1>
        <p className="text-sm text-black/60">
          داخلي فقط · noindex · {rows.length} مقال
        </p>
      </header>
      <div className="overflow-x-auto rounded-xl border border-primary/15">
        <table className="min-w-full text-sm">
          <thead className="bg-primary/[0.06] text-primary">
            <tr>
              <th className="px-3 py-2 text-start">التاريخ</th>
              <th className="px-3 py-2 text-start">المدينة</th>
              <th className="px-3 py-2 text-start">العمود</th>
              <th className="px-3 py-2 text-start">الحالة</th>
              <th className="px-3 py-2 text-start">العنوان</th>
              <th className="px-3 py-2 text-start">ناقص</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.slug} className="border-t border-primary/10 align-top">
                <td className="px-3 py-2 whitespace-nowrap">{row.date_planned || "—"}</td>
                <td className="px-3 py-2 whitespace-nowrap">{row.city}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {row.pillar}
                  {row.lead_code ? ` · ${row.lead_code}` : ""}
                </td>
                <td className="px-3 py-2 whitespace-nowrap font-semibold">
                  {row.status}
                </td>
                <td className="px-3 py-2">
                  <a
                    className="text-primary underline"
                    href={`/internal/guides${row.slug.replace(/^\/guides/, "")}?token=${encodeURIComponent(sp?.token || "")}`}
                  >
                    {row.title}
                  </a>
                </td>
                <td className="px-3 py-2 text-black/70">
                  {(row.missing || []).join(" · ") || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

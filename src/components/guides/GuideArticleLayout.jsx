import Link from "next/link";
import GuideMarkdown from "./GuideMarkdown";
import GuideWhatsAppCta from "./GuideWhatsAppCta";
import GuideStickyWhatsApp from "./GuideStickyWhatsApp";
import GuideShareButtons from "./GuideShareButtons";
import { normalizeSlug } from "@/lib/guides/load";
import { actionButtonClass } from "@/components/ui/action-button-class";
import ActionButtonArrow from "@/components/ui/action-button-arrow";

function formatArDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  try {
    return new Intl.DateTimeFormat("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(d);
  } catch {
    return String(value);
  }
}

export default function GuideArticleLayout({
  guide,
  breadcrumbs = [],
  related = [],
  preview = false,
}) {
  const slug = normalizeSlug(guide.slug);
  const updated = formatArDate(guide.date_updated || guide.date_published);
  const faq = guide.faq || [];
  const sources = guide.sources || [];
  const hasVerify =
    (guide.body && guide.body.includes("[[VERIFY")) ||
    (Array.isArray(guide.missing) && guide.missing.length > 0);

  return (
    <>
      <article className="container py-10 sm:py-14 pb-28 lg:pb-14 max-w-3xl">
        {preview ? (
          <p className="mb-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm px-4 py-2">
            معاينة داخلية — الحالة: <strong>{guide.status}</strong> — لن تُفهرس
            ولن تظهر في السايت ماب.
          </p>
        ) : null}

        {hasVerify && !preview ? (
          <p className="mb-4 rounded-xl border border-primary/20 bg-primary/[0.03] text-sm text-black/75 px-4 py-3 leading-relaxed">
            بعض الأرقام أو البنود في المقال معلّمة للتأكيد من مصادر حديثة. بنحدّث
            الصفحة لما تتقفل البيانات — ومتعتمدش على أي صف فيه «للتأكيد» كسعر
            نهائي.
          </p>
        ) : null}

        <nav className="text-sm text-black/55 mb-6 flex flex-wrap gap-1" aria-label="مسار التنقل">
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.url} className="inline-flex items-center gap-1">
              {i > 0 ? <span aria-hidden>‹</span> : null}
              <Link href={crumb.path || crumb.url.replace(/^https?:\/\/[^/]+/, "")} className="hover:text-primary hover:underline">
                {crumb.name}
              </Link>
            </span>
          ))}
        </nav>

        <header className="space-y-3 mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-primary leading-snug">
            {guide.h1 || guide.title}
          </h1>
          {updated ? (
            <p className="text-sm text-black/55">آخر تحديث: {updated}</p>
          ) : null}
          {guide.description ? (
            <p className="text-base sm:text-lg text-black/75 leading-relaxed">
              {guide.description}
            </p>
          ) : null}
        </header>

        <GuideWhatsAppCta leadCode={guide.lead_code} compact />

        <GuideMarkdown content={guide.body} />

        {faq.length > 0 ? (
          <section className="mt-12 space-y-4" aria-labelledby="guide-faq">
            <h2 id="guide-faq" className="text-xl sm:text-2xl font-bold text-primary">
              أسئلة شائعة
            </h2>
            {faq.map((item) => (
              <div key={item.q || item.question} className="border-b border-primary/10 pb-4">
                <h3 className="font-bold text-primary mb-1">
                  {item.q || item.question}
                </h3>
                <p className="text-black/80 leading-relaxed">
                  {item.a || item.answer}
                </p>
              </div>
            ))}
          </section>
        ) : null}

        {sources.length > 0 ? (
          <section className="mt-10 space-y-2" aria-labelledby="guide-sources">
            <h2 id="guide-sources" className="text-lg font-bold text-primary">
              المصادر
            </h2>
            <ul className="space-y-2 text-sm text-black/70">
              {sources.map((src) => (
                <li key={typeof src === "string" ? src : src.url || src.name}>
                  {typeof src === "string" ? (
                    src
                  ) : src.url ? (
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline underline-offset-2"
                    >
                      {src.name || src.url}
                    </a>
                  ) : (
                    src.name
                  )}
                  {src.date ? ` — ${src.date}` : null}
                  {src.type ? ` (${src.type})` : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <GuideWhatsAppCta leadCode={guide.lead_code} />

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link href="/#buy-request" className={actionButtonClass({ variant: "secondary" })}>
            اكتب طلبك العقاري
            <ActionButtonArrow />
          </Link>
          {guide.pillar === "P4" ? (
            <Link href="/opportunities" className={actionButtonClass({ variant: "secondary" })}>
              الفرص العقارية
              <ActionButtonArrow />
            </Link>
          ) : null}
        </div>

        <div className="mt-8">
          <GuideShareButtons title={guide.title} slug={slug} />
        </div>

        {related.length > 0 ? (
          <nav className="mt-12 pt-8 border-t border-primary/10 space-y-3" aria-label="مقالات ذات صلة">
            <p className="text-sm font-semibold text-primary">اقرأ كمان</p>
            {related.map((item) => (
              <Link
                key={item.slug}
                href={normalizeSlug(item.slug)}
                className="block text-primary font-semibold hover:underline"
              >
                {item.title || item.h1}
              </Link>
            ))}
          </nav>
        ) : null}

        <p className="mt-10 text-sm text-black/50 leading-relaxed">
          فريق لينا عقار — منصة عقارية بتبدأ من طلب المشتري.
        </p>
      </article>
      <GuideStickyWhatsApp leadCode={guide.lead_code} />
    </>
  );
}

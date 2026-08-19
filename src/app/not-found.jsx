import Link from "next/link";

export const metadata = {
  title: "الصفحة غير موجودة",
  robots: { index: false, follow: true },
};

/**
 * Root 404. Without this, unmatched URLs fell through to the CRM's single-segment
 * dynamic route and were served at HTTP 200 — a soft 404 on every typo'd link.
 */
export default function NotFound() {
  return (
    <main className="container flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <p className="text-sm font-medium text-black/50 tabular-nums">404</p>
      <h1 className="mt-3 text-3xl font-bold leading-snug text-primary">
        الصفحة دي مش موجودة
      </h1>
      <p className="mt-3 max-w-md text-black/70">
        يمكن اللينك قديم أو الوحدة اتشالت. جرّب ترجع للرئيسية أو تشوف الفرص
        المعروضة دلوقتي.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 py-3 text-sm font-medium text-white"
        >
          الرئيسية
        </Link>
        <Link
          href="/opportunities"
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-black/15 px-4 py-3 text-sm font-medium text-primary"
        >
          شوف الفرص
        </Link>
      </div>
    </main>
  );
}

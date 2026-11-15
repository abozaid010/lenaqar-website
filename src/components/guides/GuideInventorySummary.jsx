import Link from "next/link";
import { formatEgpNumber } from "@/lib/lenaqar/metrics";

function formatArDay(day) {
  const d = new Date(`${day}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return day;
  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Africa/Cairo",
  }).format(d);
}

function Egp({ value }) {
  return (
    <span className="whitespace-nowrap tabular-nums" dir="ltr">
      {formatEgpNumber(value)} <span dir="rtl">ج.م</span>
    </span>
  );
}

/**
 * LenAqar's own asking-price table for an area price guide. Server component;
 * renders nothing without a complete summary (see inventory-summary.js).
 */
export default function GuideInventorySummary({ summary }) {
  if (!summary?.rows?.length) return null;
  const [all] = summary.rows;
  const asOf = formatArDay(summary.asOf);

  return (
    <section className="mt-12" aria-labelledby="guide-inventory">
      <h2 id="guide-inventory" className="text-xl sm:text-2xl font-bold text-primary mb-3">
        أسعار الطلب في إعلانات لينا عقار: شقق ريسيل في {summary.placeAr}
      </h2>
      <p className="text-black/80 leading-relaxed">
        في {asOf}، وسيط سعر المتر لـ {all.count} شقة ريسيل معروضة على لينا عقار في{" "}
        {summary.placeAr} هو <strong className="text-primary"><Egp value={all.perMeter} /></strong>{" "}
        بالقيمة النقدية، ووسيط سعر الشقة <Egp value={all.unitPrice} />. دي أسعار طلب من
        البائعين، مش أسعار بيع فعلية.
      </p>

      <div className="my-6 overflow-x-auto rounded-xl border border-primary/15">
        <table className="min-w-full text-sm text-start">
          <thead className="bg-primary/[0.06] text-primary">
            <tr>
              <th className="px-3 py-2 font-bold text-start whitespace-nowrap">الفئة</th>
              <th className="px-3 py-2 font-bold text-start whitespace-nowrap">عدد الإعلانات</th>
              <th className="px-3 py-2 font-bold text-start whitespace-nowrap">وسيط سعر المتر</th>
              <th className="px-3 py-2 font-bold text-start whitespace-nowrap">وسيط سعر الشقة</th>
              <th className="px-3 py-2 font-bold text-start whitespace-nowrap">النطاق المعتاد</th>
            </tr>
          </thead>
          <tbody>
            {summary.rows.map((row) => (
              <tr key={row.labelAr}>
                <td className="px-3 py-2 border-t border-primary/10 text-black/80 align-top whitespace-nowrap">
                  {row.labelAr}
                </td>
                <td className="px-3 py-2 border-t border-primary/10 text-black/80 align-top tabular-nums">
                  {row.count}
                </td>
                <td className="px-3 py-2 border-t border-primary/10 text-black/80 align-top">
                  <Egp value={row.perMeter} />
                </td>
                <td className="px-3 py-2 border-t border-primary/10 text-black/80 align-top">
                  <Egp value={row.unitPrice} />
                </td>
                <td className="px-3 py-2 border-t border-primary/10 text-black/80 align-top whitespace-nowrap">
                  <Egp value={row.lowest} /> – <Egp value={row.highest} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="font-bold text-primary mb-2">طريقة الحساب</h3>
      <ul className="list-disc ps-5 space-y-1 text-black/80 leading-relaxed text-sm">
        <li>إعلانات ريسيل معروضة على لينا عقار بس؛ وحدات المطورين (الأولي) مش محسوبة.</li>
        <li>
          السعر بالقيمة النقدية: كاش البائع النهارده + الأقساط الباقية بعد خصمها، زي سعر المتر
          اللي في كروت الإعلانات.
        </li>
        <li>الوسيط هو الشقة اللي في النص: نص الإعلانات أرخص منه ونصها أغلى.</li>
        <li>
          الإعلانات اللي سعر المتر فيها مستحيل (غلطة كتابة) مستبعدة، والنطاق المعتاد بيستبعد
          أرخص 5% وأغلى 5%.
        </li>
        <li>أي فئة فيها أقل من 20 إعلان مش بتظهر في الجدول.</li>
        <li>
          تواريخ آخر تحديث للإعلانات دي بين {formatArDay(summary.records.earliest)} و
          {" "}{formatArDay(summary.records.latest)}؛ السعر النهائي بيتحدد بالتفاوض والمعاينة.
        </li>
      </ul>
      <p className="mt-4 text-sm">
        <Link href={summary.listingsHref} className="font-bold text-primary underline underline-offset-4">
          شوف الإعلانات نفسها في {summary.placeAr}
        </Link>
      </p>
    </section>
  );
}

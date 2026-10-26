"use client";

import { SITE } from "@/config/site";

export default function GuideShareButtons({ title, slug }) {
  const url = encodeURIComponent(`${SITE.url}${slug}`);
  const text = encodeURIComponent(title || "لينا عقار — دليل المشتري");
  const wa = `https://wa.me/?text=${text}%20${url}`;
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${url}`;

  return (
    <div className="flex flex-wrap gap-3 text-sm">
      <a
        href={wa}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full border border-primary/20 px-3 py-1.5 text-primary hover:bg-primary/[0.04]"
      >
        مشاركة واتساب
      </a>
      <a
        href={fb}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full border border-primary/20 px-3 py-1.5 text-primary hover:bg-primary/[0.04]"
      >
        مشاركة فيسبوك
      </a>
    </div>
  );
}

import { BRAND } from "@/config/brand";
import { SITE } from "@/config/site";

export function doorMetadata(door) {
  const url = `${SITE.url}${door.href}`;
  // Absolute title: door.title already includes «| لينا عقار»; the root
  // template is `%s | لينا عقار` and would otherwise double the brand.
  return {
    title: { absolute: door.title },
    description: door.description,
    openGraph: {
      title: door.title,
      description: door.description,
      url,
      locale: "ar_EG",
      siteName: SITE.name,
      type: "website",
      images: [
        {
          url: `${SITE.url}${BRAND.socialImage}`,
          width: 1200,
          height: 630,
          alt: BRAND.socialAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: door.title,
      description: door.description,
      images: [`${SITE.url}${BRAND.socialImage}`],
    },
    alternates: { canonical: url },
  };
}

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
          url: `${SITE.url}/images/default_logo.jpg`,
          width: 1200,
          height: 630,
          alt: SITE.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: door.title,
      description: door.description,
      images: [`${SITE.url}/images/default_logo.jpg`],
    },
    alternates: { canonical: url },
  };
}

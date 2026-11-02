import { SITE } from "@/config/site";

export function doorMetadata(door) {
  const url = `${SITE.url}${door.href}`;
  return {
    title: door.title,
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
          url: `${SITE.url}/images/logo.png`,
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
      images: [`${SITE.url}/images/logo.png`],
    },
    alternates: { canonical: url },
  };
}

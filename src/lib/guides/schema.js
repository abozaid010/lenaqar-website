import { SITE } from "@/config/site";
import { LENAQAR_CONTACT } from "@/config/lenaqar-contact";
import { normalizeSlug } from "./load";

export function buildBreadcrumbList(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildFaqPage(faq = []) {
  if (!faq.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q || item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a || item.answer,
      },
    })),
  };
}

export function buildArticleSchema(guide, { placeName } = {}) {
  const url = `${SITE.url}${normalizeSlug(guide.slug)}`;
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    inLanguage: "ar-EG",
    datePublished: guide.date_published || guide.date_planned,
    dateModified: guide.date_updated || guide.date_published || guide.date_planned,
    author: {
      "@type": "Organization",
      name: "لينا عقار",
      alternateName: "Lenaqar",
      url: SITE.url,
    },
    publisher: {
      "@type": "Organization",
      name: "لينا عقار",
      alternateName: "Lenaqar",
      logo: {
        "@type": "ImageObject",
        url: `${SITE.url}/images/logo.png`,
      },
    },
    image: `${SITE.url}/images/logo.png`,
    mainEntityOfPage: url,
    url,
  };
  if (placeName) {
    schema.about = {
      "@type": "Place",
      name: placeName,
      address: {
        "@type": "PostalAddress",
        addressCountry: "EG",
        addressLocality: placeName,
      },
    };
  }
  return schema;
}

export function buildPlaceSchema(city) {
  if (!city) return null;
  return {
    "@context": "https://schema.org",
    "@type": "Place",
    name: city.name_ar,
    alternateName: city.name_en,
    address: {
      "@type": "PostalAddress",
      addressCountry: "EG",
      addressLocality: city.name_ar,
    },
  };
}

export function guideJsonLdScripts(guide, { breadcrumbs = [], city = null } = {}) {
  const blocks = [];
  if (breadcrumbs.length) blocks.push(buildBreadcrumbList(breadcrumbs));
  if (guide.pillar === "hub" && city) {
    const place = buildPlaceSchema(city);
    if (place) blocks.push(place);
  } else {
    blocks.push(
      buildArticleSchema(guide, {
        placeName: city?.name_ar,
      }),
    );
  }
  const faq = buildFaqPage(guide.faq || []);
  if (faq) blocks.push(faq);
  return blocks;
}

export function organizationContactForGuides() {
  return {
    telephone: LENAQAR_CONTACT.whatsappE164,
    whatsapp: LENAQAR_CONTACT.whatsappE164,
  };
}

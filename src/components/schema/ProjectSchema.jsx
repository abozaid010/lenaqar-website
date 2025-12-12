import { SITE_URL } from "@/app/metadata";

export default function ProjectSchema({ project }) {
  if (!project) return null;

  const schema = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: project.name || "Real Estate Project",
    url: `${SITE_URL}/projects/${project.id}`,
    image: project.mainImage || project.image || `${SITE_URL}/images/property_placeholder.jpg`,
    description: project.description || "Real estate project",
    address: {
      "@type": "PostalAddress",
      addressLocality: project.location || project.city || "Cairo",
      addressCountry: "EG",
    },
    offers: {
      "@type": "Offer",
      price: project.startingPrice || project.price || "0",
      priceCurrency: "EGP",
      availability: "https://schema.org/InStock",
    },
    ...(project.developer && {
      seller: {
        "@type": "Organization",
        name: project.developer.name || "Developer",
      },
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}


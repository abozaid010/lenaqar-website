import { SITE_URL } from "@/app/metadata";

export default function SolutionsPageSchema({ path, title, description }) {
  const url = `${SITE_URL}${path}`;

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: title,
        description,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: {
          "@type": "SoftwareApplication",
          name: "Lena AI",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web, iOS, Android",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

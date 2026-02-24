// Allow CDN (e.g. Cloudflare) and Next.js to cache this static page
export const revalidate = 86400; // 24 hours

export const metadata = {
  title: "Abozaid Ibrahim | CEO – Lena AI",
  description:
    "Digital business card – Abozaid Ibrahim, CEO of Lena AI. Save contact, download the Lena AI app.",
  metadataBase: new URL("https://contact.lenaai.net"),
  alternates: {
    canonical: "https://contact.lenaai.net",
  },
  openGraph: {
    title: "Abozaid Ibrahim | CEO – Lena AI",
    description: "CEO of Lena AI - AI Solutions & Dashboards",
    url: "https://contact.lenaai.net",
  },
};

export default function ContactLayout({ children }) {
  return children;
}

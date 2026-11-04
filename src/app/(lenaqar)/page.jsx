import { SITE } from "@/config/site";
import { fetchPublicRequirements } from "@/lib/lenaqar/requirements.server";
import StorytellingHomepage from "@/components/lenaqar/storytelling-homepage";
import FaqSchema from "@/components/schema/FaqSchema";

export const revalidate = 300;

export const metadata = {
  title: {
    absolute:
      "لينا عقار | اشتري أو بيع بيتك بأرقام حقيقية من غير مكالمات",
  },
  description:
    "ابعت طلبك واتساب، والذكاء الاصطناعي يدوّرلك على وحدات مناسبة، ومحامي يراجع ورق أي وحدة ريسيل. أرقام أوضح لما تكون متاحة — ومش هنتصل إلا لو طلبت.",
  openGraph: {
    title: "لينا عقار | اشتري أو بيع بيتك بأرقام حقيقية من غير مكالمات",
    description:
      "ابعت طلبك واتساب، والذكاء الاصطناعي يدوّرلك على وحدات مناسبة، ومحامي يراجع ورق أي وحدة ريسيل. أرقام أوضح لما تكون متاحة — ومش هنتصل إلا لو طلبت.",
    url: SITE.url,
    locale: "ar_EG",
    siteName: SITE.name,
    type: "website",
    images: [{ url: `${SITE.url}/images/logo.png`, width: 1200, height: 630, alt: SITE.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: "لينا عقار | اشتري أو بيع بيتك بأرقام حقيقية من غير مكالمات",
    description:
      "ابعت طلبك واتساب، والذكاء الاصطناعي يدوّرلك على وحدات مناسبة، ومحامي يراجع ورق أي وحدة ريسيل. أرقام أوضح لما تكون متاحة — ومش هنتصل إلا لو طلبت.",
    images: [`${SITE.url}/images/logo.png`],
  },
  alternates: {
    canonical: SITE.url,
  },
};

export default async function LenaqarHomePage() {
  const { requirements, error } = await fetchPublicRequirements({ limit: 48 });
  return (
    <>
      <FaqSchema />
      <StorytellingHomepage requirements={requirements} error={error} />
    </>
  );
}

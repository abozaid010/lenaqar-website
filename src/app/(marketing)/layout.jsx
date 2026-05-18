import SolutionsFooter from "@/components/web/solutions/layout/SolutionsFooter";
import SolutionsNavbar from "@/components/web/solutions/layout/SolutionsNavbar";
import StickyCtaBar from "@/components/web/solutions/ui/StickyCtaBar";
import { COOKIE_KEYS } from "@/constants/cookieKeys";
import { cookies } from "next/headers";

export default async function MarketingLayout({ children }) {
  const cookieStore = await cookies();
  const clientId = cookieStore.get(COOKIE_KEYS.CLIENT_ID)?.value;

  return (
    <>
      <SolutionsNavbar clientId={clientId} />
      {children}
      <SolutionsFooter />
      <StickyCtaBar />
    </>
  );
}

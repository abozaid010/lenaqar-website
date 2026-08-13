import { notFound } from "next/navigation";
import LenaqarHeader from "@/components/lenaqar/lenaqar-header";
import LenaqarFooter from "@/components/lenaqar/lenaqar-footer";
import StickyActionsBar from "@/components/lenaqar/sticky-whatsapp-bar";

export default function LenaqarLayout({ children }) {
  // Read at request time so a CLI `NEXT_PUBLIC_SITE_BRAND=lenaqar` is honoured
  // even if a cached RSC module inlined the empty .env value.
  const isLenaqar =
    (process.env.NEXT_PUBLIC_SITE_BRAND ||
      process.env["NEXT_PUBLIC_SITE_BRAND"] ||
      "").trim() === "lenaqar";
  if (!isLenaqar) notFound();

  return (
    <div className="min-h-screen flex flex-col bg-white text-black">
      <LenaqarHeader />
      <main className="flex-1 pb-20 lg:pb-0">{children}</main>
      <LenaqarFooter />
      <StickyActionsBar />
    </div>
  );
}

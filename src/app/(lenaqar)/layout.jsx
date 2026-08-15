import LenaqarHeader from "@/components/lenaqar/lenaqar-header";
import LenaqarFooter from "@/components/lenaqar/lenaqar-footer";
import StickyActionsBar from "@/components/lenaqar/sticky-whatsapp-bar";
import LenaqarLocale from "@/components/lenaqar/lenaqar-locale";

export default function LenaqarLayout({ children }) {
  return (
    <LenaqarLocale>
      <div className="min-h-screen flex flex-col bg-white text-black">
        <LenaqarHeader />
        <main className="flex-1 pb-20 lg:pb-0">{children}</main>
        <LenaqarFooter />
        <StickyActionsBar />
      </div>
    </LenaqarLocale>
  );
}

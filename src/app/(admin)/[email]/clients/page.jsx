import { redirect } from "next/navigation";
import { isKingAdmin } from "@/lib/kingAdmin";
import ClientsListWrapper from "./_components/ClientsListWrapper";
import enTranslations from "../../../../../public/locales/en.js";
import arTranslations from "../../../../../public/locales/ar.js";

export async function generateMetadata() {
  // For metadata generation, we'll use a default approach
  // since we can't reliably detect locale at build time
  const locale = "en"; // Default to English for metadata
  const translations = locale === "ar" ? arTranslations : enTranslations;
  const t = translations;
  
  return {
    title: t.clients || "Clients",
  };
}

export default async function ClientsPage({ params }) {
  const { email } = await params;

  if (!isKingAdmin(email)) {
    redirect("/dashboard");
  }

  return <ClientsListWrapper />;
}

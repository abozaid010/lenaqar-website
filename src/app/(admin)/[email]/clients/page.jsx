import { redirect } from "next/navigation";
import { isKingAdmin } from "@/lib/kingAdmin";
import ClientsListWrapper from "./_components/ClientsListWrapper";

export const metadata = { title: "Clients" };

export default async function ClientsPage({ params }) {
  const { email } = await params;

  if (!isKingAdmin(email)) {
    redirect("/dashboard");
  }

  return <ClientsListWrapper />;
}

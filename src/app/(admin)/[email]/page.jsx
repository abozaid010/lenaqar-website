import ClientInfo from "./_components/clientInfo";

export default async function ClientPage({ params }) {
  const { email } = await params;

  return <ClientInfo client_email={email} />;
}

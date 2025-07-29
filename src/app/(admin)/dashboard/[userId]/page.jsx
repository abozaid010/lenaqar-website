import { cookies } from "next/headers";
import ChatClientWrapper from "./_components/chat-client-wrapper";

export default async function ChatPage({ params }) {
  const cookiesStore = await cookies();
  const { userId } = await params;

  const clientId = cookiesStore.get("lena-website-client_id");

  return (
    <div className="container flex flex-col gap-3 relative pb-4 overflow-hidden h-full">
      <ChatClientWrapper userId={userId} clientId={clientId} />
    </div>
  );
}

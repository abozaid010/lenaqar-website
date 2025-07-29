import ChatClientWrapper from "./_components/chat-client-wrapper";

export default async function ChatPage({ params }) {
  const { userId } = await params;

  return (
    <div className="container flex flex-col gap-3 relative pb-4 overflow-hidden h-full">
      <ChatClientWrapper userId={userId} />
    </div>
  );
}

import { getChatHistory } from "@/components/services/serviceFetching";
import ChatClientWrapper from "../_components/chat-client-wrapper";

export default async function ChatPage({ params }) {
  const { id } = await params;

  // Fetch initial chat history on the server
  const initialData = await getChatHistory(id);

  return <ChatClientWrapper initialData={initialData} userId={id} />;
}

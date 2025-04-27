import { getChatHistory } from "@/components/services/serviceFetching";
import ChatClientWrapper from "../_components/chat-client-wrapper";
import ToggleReplyType from "../_components/reply-type";
import { getClientid } from "@/components/services/clientCookies";

export default async function ChatPage({ params }) {
  const { id } = await params;
  const clientID = await getClientid();

  // Fetch initial chat history on the server
  const initialData = await getChatHistory(id);
  console.log(initialData)

  return (
    <>
      <div className="flex items-center justify-between mb-4 container mx-auto bg-white px-4 py-2 rounded-md shadow-md">
        <h1 className="text-xl text-gray-700">
          Chat with_<span className="text-primary font-bold">{id}</span>
        </h1>
        <ToggleReplyType phoneNumber={id} clientID={clientID} />
      </div>
      <ChatClientWrapper initialData={initialData} userId={id} />
    </>
  );
}

import { getChatHistory } from "@/components/services/serviceFetching";
import ChatClientWrapper from "../_components/chat-client-wrapper";
import ToggleReplyType from "../_components/reply-type";
import { getClientid } from "@/components/services/clientCookies";
import Chat_with from "../_components/Chat_with";

export default async function ChatPage({ params ,searchParams }) {
  const { id } = await params;
  const clientID = await getClientid();
 const name = searchParams?.name
  // Fetch initial chat history on the server
  const initialData = await getChatHistory(id);
  

  return (
    <>
      <div className="flex items-center justify-between mb-4 container mx-auto bg-white px-4 py-2 rounded-md shadow-md">
        {/* <h1 className="text-xl text-gray-700">
          Chat with_<span className="text-primary font-bold">{name}</span>
        </h1> */}
        <Chat_with name={name}/>

        <ToggleReplyType phoneNumber={id} clientID={clientID} />
      </div>
      <ChatClientWrapper initialData={initialData} userId={id} />
    </>
  );
}

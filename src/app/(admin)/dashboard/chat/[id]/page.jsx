import { getChatHistory } from "@/components/services/serviceFetching";
import ChatClientWrapper from "../_components/chat-client-wrapper";
import ToggleReplyType from "../_components/reply-type";
import { getClientid } from "@/components/services/clientCookies";
import ChatWith from "../_components/Chat_with";
import Link from "next/link";

export default async function ChatPage({ params }) {
  const { id } = await params;
  const clientID = await getClientid();
  // Fetch initial chat history on the server
  const initialData = await getChatHistory(id);

  let hasAccess = true;
  if (initialData?.status === 401) {
    hasAccess = false;
  }

  const name = initialData?.name || "New Lead";

  return (
    <div className="flex flex-col gap-3 relative pb-4 overflow-hidden h-full">
      {hasAccess ? (
        <>
          <div className="flex items-center justify-between container mx-auto bg-white px-4 py-2 rounded-md shadow-md h-auto">
            <ChatWith name={name} />

            <ToggleReplyType phoneNumber={id} clientID={clientID} />
          </div>

          <div className="flex-1 h-[90%]">
            <ChatClientWrapper
              initialData={initialData?.messages}
              userId={id}
            />
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full">
          <h1 className="text-2xl font-bold text-gray-800">Access Denied</h1>
          <p className="text-gray-600 mt-2">
            You do not have permission to view this chat.
          </p>
          <Link
            href="/dashboard"
            className="underline text-sm text-blue-700 mt-4"
          >
            Go Back to Dashboard
          </Link>
        </div>
      )}
    </div>
  );
}

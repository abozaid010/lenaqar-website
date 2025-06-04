import { getClientid } from "@/components/services/clientCookies";
import {
  getChatHistory,
  resetUnreadMessagesCount,
} from "@/components/services/serviceFetching";
import { CircleX } from "lucide-react";
import Link from "next/link";
import ChatClientWrapper from "../_components/chat-client-wrapper";
import ChatWith from "../_components/Chat_with";
import ToggleReplyType from "../_components/reply-type";
import NavigationButtons from "./_components/NavigationButtons";

export default async function ChatPage({ params }) {
  const { id } = await params;

  const clientID = await getClientid();

  const initialData = await getChatHistory(id);
  await resetUnreadMessagesCount(id);

  let hasAccess = true;
  if (!initialData?.status) {
    hasAccess = false;
  }

  const name = initialData.data?.name;

  // Find current index and get next/previous IDs

  return (
    <div className="flex flex-col gap-3 relative pb-4 overflow-hidden h-full">
      {hasAccess ? (
        <>
          <div className="flex items-center justify-between container mx-auto bg-white px-4 py-2 rounded-md shadow-md h-auto">
            <div className="flex items-center gap-4">
              {/* Navigation Buttons */}
              <NavigationButtons id={id} />
              <ChatWith name={name} />
            </div>
            <div className="flex items-center gap-4">
              <ToggleReplyType phoneNumber={id} clientID={clientID} />
              <Link
                href={`/dashboard`}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                <CircleX className="w-8 h-8" color="red" />
              </Link>
            </div>
          </div>

          <div className="flex-1 h-[90%]">
            <ChatClientWrapper
              initialData={initialData.data?.messages}
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

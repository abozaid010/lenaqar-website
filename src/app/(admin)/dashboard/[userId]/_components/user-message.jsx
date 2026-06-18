"use client";

import SafeImage from "@/components/ui/safe-image";
import { formatTimestamp } from "@/utils/formateDate";
import { resolveChatMessageImageUrl, getDisplayUserMessageText } from "@/utils/imageUtils";

export default function UserMessageCard({ message, imageUrl, timestamp }) {
  const messageText = getDisplayUserMessageText(message);
  const resolvedImageUrl = resolveChatMessageImageUrl(imageUrl);

  if (!messageText && !resolvedImageUrl) {
    return null;
  }

  return (
    <div className="w-fit rounded-lg p-2 bg-white flex flex-col max-w-xs">
      {resolvedImageUrl && (
        <SafeImage
          src={resolvedImageUrl}
          alt=""
          width={240}
          height={240}
          className="max-w-[240px] max-h-[240px] rounded-md mb-2 object-cover border border-gray-200"
        />
      )}
      {messageText && <div className="text-sm text-black">{messageText}</div>}
      {timestamp && (
        <div className="text-xs mt-2 text-gray-600 text-end">
          {formatTimestamp(timestamp)}
        </div>
      )}
    </div>
  );
}

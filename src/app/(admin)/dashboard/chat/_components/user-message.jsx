import { formatTimestamp } from "@/utils/formateDate";

export default function UserMessageCard({ message, timestamp }) {
  return (
    <div className="w-fit rounded-lg p-2 bg-white text-white flex flex-col">
      <div className="text-sm text-black">{message}</div>
      <div className="text-xs mt-2 text-black">
        {formatTimestamp(timestamp)}
      </div>
    </div>
  );
}

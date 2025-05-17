export default function UserMessageCard({ message, timestamp }) {
  function formatTimestamp(ts) {
    if (!ts) return "";
    const date = typeof ts === "string" ? new Date(ts) : ts;
    const options = { year: "numeric", month: "long", day: "numeric" };
    const datePart = date.toLocaleDateString(undefined, options);
    const timePart = date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return `${datePart} - ${timePart}`;
  }

  return (
    <div className="w-fit rounded-lg p-2 bg-[#e2dbff] text-white flex flex-col">
      <div className="text-sm text-black">{message}</div>
      <div className="text-xs mt-2 text-black">
        {formatTimestamp(timestamp)}
      </div>
    </div>
  );
}

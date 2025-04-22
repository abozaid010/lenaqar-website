export default function UserMessageCard({ message }) {
  return (
    <div className="w-fit rounded-lg p-2 bg-[#e2dbff] text-white flex flex-col">
      <div className="text-sm text-black">{message}</div>
      <div className="text-xs mt-2 text-black">
        {new Date().toLocaleString()}
      </div>
    </div>
  );
}

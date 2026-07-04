"use client";

export default function ChatConversationSkeleton({ rows = 4 }) {
  return (
    <div className="flex flex-col gap-3 p-3 animate-pulse" aria-hidden>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className={`flex ${index % 2 === 0 ? "justify-start" : "justify-end"}`}
        >
          <div
            className={`h-10 rounded-2xl bg-gray-200/80 ${
              index % 2 === 0 ? "w-[55%]" : "w-[45%]"
            }`}
          />
        </div>
      ))}
    </div>
  );
}

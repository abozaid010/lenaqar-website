"use client";

function ChatReadTicks() {
  return (
    <svg
      className="chat-read-ticks"
      width="16"
      height="11"
      viewBox="0 0 16 11"
      aria-hidden="true"
    >
      <path
        d="M11.071.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-2.405-2.272a.463.463 0 0 0-.336-.146.47.47 0 0 0-.343.15.444.444 0 0 0-.14.333c0 .12.047.234.133.321l2.75 2.6a.47.47 0 0 0 .336.146.45.45 0 0 0 .337-.15l6.522-8.042a.43.43 0 0 0 .108-.32.445.445 0 0 0-.153-.331z"
        fill="currentColor"
      />
      <path
        d="M15.071.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-8.19 9.636-2.405-2.272a.463.463 0 0 0-.336-.146.47.47 0 0 0-.343.15.444.444 0 0 0-.14.333c0 .12.047.234.133.321l2.75 2.6a.47.47 0 0 0 .336.146.45.45 0 0 0 .337-.15l8.522-10.042a.43.43 0 0 0 .108-.32.445.445 0 0 0-.153-.331z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function ChatMessageBubble({
  children,
  variant = "incoming",
  timestamp,
  showReadTicks = false,
  className = "",
}) {
  const isOutgoing = variant === "outgoing";

  return (
    <div
      className={`chat-bubble chat-bubble--${variant} ${className}`.trim()}
    >
      <div className="chat-bubble-body">{children}</div>
      {timestamp ? (
        <span className="chat-bubble-meta">
          <time dateTime={String(timestamp)}>{timestamp}</time>
          {isOutgoing && showReadTicks ? <ChatReadTicks /> : null}
        </span>
      ) : null}
    </div>
  );
}

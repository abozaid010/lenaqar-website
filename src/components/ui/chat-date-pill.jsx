"use client";

export default function ChatDatePill({ label }) {
  if (!label) return null;

  return (
    <div className="flex justify-center my-3 px-2" role="separator" aria-label={label}>
      <span className="chat-date-pill">{label}</span>
    </div>
  );
}

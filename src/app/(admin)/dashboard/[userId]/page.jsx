import { redirect } from "next/navigation";

export default async function ChatPage({ params }) {
  const { userId } = await params;
  redirect(`/dashboard?userId=${encodeURIComponent(userId)}`);
}

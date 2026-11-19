import MatchLoading from "@/components/lenaqar/match-loading";

// Shown the moment the match page is requested (a submit, a shared link, a WhatsApp link),
// while the matches are read. The same screen the request form shows while it saves.
export default function RequestMatchLoading() {
  return <MatchLoading />;
}

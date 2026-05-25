import MatchPublicPage from "./_components/MatchPublicPage";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function MatchPage({ params }: PageProps) {
  const { token } = await params;
  return <MatchPublicPage token={token} />;
}

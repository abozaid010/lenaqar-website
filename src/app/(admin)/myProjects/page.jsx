import { cookies } from "next/headers";
import ProjectsList from "./_components/ProjectsList";

export default async function ProjectsPage() {
  const cookieStore = await cookies();
  const clientId = cookieStore.get("lena-website-client_id")?.value || null;

  return <ProjectsList clientId={clientId} />;
}

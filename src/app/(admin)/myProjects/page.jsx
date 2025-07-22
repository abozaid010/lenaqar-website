import { cookies } from "next/headers";
import ProjectsList from "./_components/ProjectsList";

const ProjectsPage = async () => {
  const cookieStore = cookies();
  const clientId = cookieStore.get("lena-website-client_id")?.value || null;

  return <ProjectsList clientId={clientId} />;
};

export default ProjectsPage;

import {
  fetchCitisAndProjects,
  fetchDevelopers,
  fetchMyProjects,
} from "@/components/services/serviceFetching";
import ProjectGrid from "./component/ProjectGrid";

const page = async () => {
  const [projects, citiesAndDistricts, developers] = await Promise.all([
    fetchMyProjects(),
    fetchCitisAndProjects(),
    fetchDevelopers(),
  ]);

  console.log("Projects:", projects);

  return (
    <ProjectGrid
      projects={projects}
      citiesAndDistricts={citiesAndDistricts}
      developers={developers}
    />
  );
};

export default page;

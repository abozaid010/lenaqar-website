import {
  fetchCitisAndProjects,
  fetchDevelopers,
  fetchMyProjects,
} from "@/components/services/serviceFetching";
import ProjectGrid from "./_components/ProjectGrid";

const page = async () => {
  const [projects, citiesAndDistricts, developers] = await Promise.all([
    fetchMyProjects(),
    fetchCitisAndProjects(),
    fetchDevelopers(),
  ]);

  const developersSet = Array.from(
    new Set(developers.map((developer) => developer.name))
  );

  return (
    <ProjectGrid
      projects={projects}
      citiesAndDistricts={citiesAndDistricts}
      developers={developersSet}
    />
  );
};

export default page;

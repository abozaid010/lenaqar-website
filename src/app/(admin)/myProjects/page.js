import { fetchCitisAndProjects, fetchDevelopers, fetchMyProjects } from '@/components/services/serviceFetching';
import ProjectGrid from './component/ProjectGrid';
import React from 'react'
import { cookies } from 'next/headers';

const page = async () => {
  const [projects,citiesAndDistricts,developers] = await Promise.all([
    fetchMyProjects(),
    fetchCitisAndProjects(),
    fetchDevelopers(),
  ]);
  const cookieStore = await cookies();
  const clientId = cookieStore.get("client_id")?.value;
 
  return (
    <div>
      <ProjectGrid projects={projects} citiesAndDistricts={citiesAndDistricts} developers={developers} clientId={clientId} />
    </div>
  )
}

export default page

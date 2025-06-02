import { fetchCitisAndProjects, fetchDevelopers, fetchMyProjects } from '@/components/services/serviceFetching';
import ProjectGrid from './component/ProjectGrid';
import React from 'react'

const page = async () => {
  const [projects,citiesAndDistricts,developers] = await Promise.all([
    fetchMyProjects(),
    fetchCitisAndProjects(),
    fetchDevelopers(),
  ]);
  
 
  return (
    <div>
      <ProjectGrid projects={projects} citiesAndDistricts={citiesAndDistricts} developers={developers}  />
    </div>
  )
}

export default page

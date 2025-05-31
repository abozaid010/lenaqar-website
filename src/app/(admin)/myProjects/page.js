import { fetchMyProjects } from '@/components/services/serviceFetching';
import ProjectGrid from './component/ProjectGrid';
import React from 'react'

const page = async () => {
  const projects = await fetchMyProjects();
  console.log(projects)
  return (
    <div>
      <ProjectGrid projects={projects} />
    </div>
  )
}

export default page

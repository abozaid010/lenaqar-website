import React from 'react'
import Schedual from './components/Schedual'
import { getschedual } from '@/components/services/serviceFetching';
const today = new Date();
today.setHours(0, 0, 0, 0); 

const sevenDaysAgo = new Date(today);
sevenDaysAgo.setDate(today.getDate() - 7);

const formattedBefore = sevenDaysAgo.toISOString().split('T')[0];

// const today = new Date();
today.setHours(0, 0, 0, 0);

const sevenDaysLater = new Date(today);
sevenDaysLater.setDate(today.getDate() + 7);

const formattedAfter = sevenDaysLater.toISOString().split('T')[0];



const page =  async () => {
    const data = await getschedual(formattedBefore,formattedAfter)
    console.log(data)
  return (
    <div>
      <Schedual data={data} />
    </div>
  )
}

export default page

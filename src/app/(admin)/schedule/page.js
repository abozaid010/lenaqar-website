import React from 'react'
import Schedual from './components/Schedual'
import { getschedual } from '@/components/services/serviceFetching';

export const dynamic = 'force-dynamic';

const today = new Date();
today.setHours(0, 0, 0, 0); // نزيل الوقت

const sevenDaysAgo = new Date(today);
sevenDaysAgo.setDate(today.getDate() - 7);

const formattedBefore = sevenDaysAgo.toISOString().split('T')[0];
console.log("تاريخ قبل 7 أيام هو:", formattedBefore);
// const today = new Date();
today.setHours(0, 0, 0, 0); // نزيل الوقت

const sevenDaysLater = new Date(today);
sevenDaysLater.setDate(today.getDate() + 7);

const formattedAfter = sevenDaysLater.toISOString().split('T')[0];
console.log("تاريخ بعد 7 أيام هو:", formattedAfter);


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

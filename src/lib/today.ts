import { transitionOnly, exclusiveAlternative } from './itinerary-presentation';
import type { Day, Place } from '../types';
import { getActivities } from './time';
export function localDay(now:Date,zone='Asia/Tokyo'){return new Intl.DateTimeFormat('sv-SE',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).format(now);}
export function todayPlan(days:Day[],places:Place[],now:Date){
 const confirmed=getActivities(days,now);
 const day=(confirmed.current?days.find(d=>d.activities.some(a=>a.id===confirmed.current!.id)):undefined)??days.find(d=>d.date===localDay(now,d.timeZone));
 const activities=day?.activities.filter(a=>!transitionOnly(a))??[];
 const clock=new Intl.DateTimeFormat('en-GB',{timeZone:day?.timeZone??'Asia/Tokyo',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(now);
 const minute=(value:string)=>Number(value.slice(0,2))*60+Number(value.slice(3,5));
 const localMinute=minute(clock);
 const scheduled=activities.map((a,index)=>({a,index,time:a.planningNote?.match(/^~?(\d{2}:\d{2})/)?.[1]})).filter(item=>item.time&&!item.a.start&&!item.a.optional&&!exclusiveAlternative(item.a,activities[item.index-1]));
 const estimated=scheduled.find((item,index)=>{
  const start=minute(item.time!);const following=scheduled[index+1];
  const end=item.a.movement?.estimatedDuration?start+item.a.movement.estimatedDuration.maxMinutes:following?minute(following.time!):1440;
  return localMinute>=start&&localMinute<end&&!item.a.completed&&!places.some(p=>p.id===item.a.placeId&&p.status==='visitado');
 });
 const upcoming=scheduled.find(item=>minute(item.time!)>localMinute&&!item.a.completed&&!places.some(p=>p.id===item.a.placeId&&p.status==='visitado'));
 const estimatedNextAt=upcoming?new Date(+now+(minute(upcoming.time!)-localMinute)*60000-now.getSeconds()*1000-now.getMilliseconds()).toISOString():undefined;
 const useEstimatedNext=Boolean(estimatedNextAt&&(!confirmed.next?.start||Date.parse(estimatedNextAt)<Date.parse(confirmed.next.start)));
 const current=confirmed.current??estimated?.a,next=useEstimatedNext?upcoming?.a:confirmed.next;
 const currentTiming=confirmed.current?'confirmed':'estimated',nextTiming=useEstimatedNext?'estimated':'confirmed';
 const nextAt=useEstimatedNext?estimatedNextAt:confirmed.next?.start;
 const total=activities.length;
 const completed=activities.filter(a=>a.completed||places.some(p=>p.id===a.placeId&&p.status==='visitado')).length;
 const featured=places.find(p=>p.id===current?.placeId)??places.find(p=>day?.activities.some(a=>a.placeId===p.id)&&p.status!=='visitado')??places.find(p=>day?.activities.some(a=>a.placeId===p.id))??places.find(p=>p.id===day?.featuredPlaceId);
 const nextPlanned=activities.find(a=>a.id!==current?.id&&!a.completed&&!places.some(p=>p.id===a.placeId&&p.status==='visitado')&&(!a.end||Date.parse(a.end)>+now));
 return {current,next,day,completed,featured,nextPlanned,total,currentTiming,nextTiming,nextAt};
}
export function countdown(timestamp:string|null|undefined,now:Date){if(!timestamp||!Number.isFinite(Date.parse(timestamp)))return 'Pendiente de confirmar';const minutes=Math.max(0,Math.ceil((Date.parse(timestamp)-+now)/60000));const days=Math.floor(minutes/1440),hours=Math.floor(minutes%1440/60);return [days?`${days} d`:'',hours?`${hours} h`:'',`${minutes%60} min`].filter(Boolean).join(' ');}

import type { Day, Place } from '../types';
import { getActivities } from './time';
export function localDay(now:Date,zone='Asia/Tokyo'){return new Intl.DateTimeFormat('sv-SE',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).format(now);}
export function todayPlan(days:Day[],places:Place[],now:Date){
 const {current,next}=getActivities(days,now);
 const day=(current?days.find(d=>d.activities.some(a=>a.id===current.id)):undefined)??days.find(d=>d.date===localDay(now,d.timeZone));
 const completed=day?.activities.filter(a=>a.completed||places.some(p=>p.id===a.placeId&&p.status==='visitado')).length??0;
 const featured=places.find(p=>p.id===current?.placeId)??places.find(p=>day?.activities.some(a=>a.placeId===p.id)&&p.status!=='visitado')??places.find(p=>day?.activities.some(a=>a.placeId===p.id))??places.find(p=>p.id===day?.featuredPlaceId);
 const nextPlanned=day?.activities.find(a=>a.id!==current?.id&&!a.completed&&!places.some(p=>p.id===a.placeId&&p.status==='visitado')&&(!a.end||Date.parse(a.end)>+now));
 return {current,next,day,completed,featured,nextPlanned};
}
export function countdown(timestamp:string|null|undefined,now:Date){if(!timestamp||!Number.isFinite(Date.parse(timestamp)))return 'Pendiente de confirmar';const minutes=Math.max(0,Math.ceil((Date.parse(timestamp)-+now)/60000));const days=Math.floor(minutes/1440),hours=Math.floor(minutes%1440/60);return [days?`${days} d`:'',hours?`${hours} h`:'',`${minutes%60} min`].filter(Boolean).join(' ');}

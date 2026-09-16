import { transitionOnly } from './itinerary-presentation';
import type { Activity, Day, Place, TripSettings } from '../types';
import { coordinates } from './wishlist';
import { distanceKm } from './nearby';
import { localDay } from './today';

export function dayProgress(day:Day,places:Place[]) {
 const activities=day.activities.filter(a=>!transitionOnly(a));
 const completed=activities.filter(a=>a.completed||places.some(p=>p.id===a.placeId&&p.status==='visitado')).length;
 return {completed,total:activities.length,status:activities.length&&completed===activities.length?'Completado':completed?'En curso':'Pendiente'};
}
export function tripPhase(settings:TripSettings,days:Day[],now:Date) {
 if(!settings.startDate||!settings.endDate)return {phase:'unknown' as const,remaining:null};
 const first=days.find(d=>d.date===settings.startDate),last=days.find(d=>d.date===settings.endDate);
 const startToday=localDay(now,first?.timeZone??'Asia/Tokyo'),endToday=localDay(now,last?.timeZone??'Asia/Tokyo');
 if(startToday<settings.startDate)return {phase:'before' as const,remaining:Math.round((Date.parse(settings.startDate)-Date.parse(startToday))/86400000)};
 if(endToday>settings.endDate)return {phase:'after' as const,remaining:0};
 return {phase:'during' as const,remaining:0};
}
function protectedActivity(a:Activity,p?:Place){return a.flexible!==true||a.locked||/vuelo|tren|autobús|transporte|traslado|hotel|alojamiento|reserva/i.test(a.category)||Boolean(a.start?.trim()||a.end?.trim()||a.transportId||a.hotelId||a.reservation?.trim()||a.trainNumber?.trim()||a.platform?.trim()||a.seat?.trim())||a.completed||p?.status==='visitado'||!p||!coordinates(p)||!a.suggestedBlock;}

// Improve only contiguous, explicitly flexible visits in the same city and time block.
// Fixed activities and missing coordinates form barriers that cannot be crossed.
export function optimizeDay(day:Day,places:Place[]) {
 const byId=new Map(places.map(p=>[p.id,p]));const place=(a?:Activity)=>a?.placeId?byId.get(a.placeId):undefined;
 const activities=[...day.activities];let savedKm=0,changed=false,eligible=0;
 for(let i=0;i<activities.length;){
  const p=place(activities[i]);if(protectedActivity(activities[i],p)){i++;continue;}
  const start=i,city=p!.city,block=activities[i].suggestedBlock;
  while(i<activities.length&&!protectedActivity(activities[i],place(activities[i]))&&place(activities[i])!.city===city&&activities[i].suggestedBlock===block)i++;
  const group=activities.slice(start,i);if(group.length<2||group.length>40)continue;eligible+=group.length;
  const left=place(activities[start-1]),right=place(activities[i]);
  const cost=(order:Activity[])=>{const route=[...(left&&coordinates(left)?[left]:[]),...order.map(a=>place(a)!),...(right&&coordinates(right)?[right]:[])];return route.slice(1).reduce((sum,p,index)=>sum+distanceKm({latitude:route[index].latitude!,longitude:route[index].longitude!},{latitude:p.latitude!,longitude:p.longitude!}),0);};
  let best=group,bestCost=cost(group);const before=bestCost;
  // Bounded 2-opt: distance estimate only, not a walking route or timetable.
  for(let pass=0;pass<Math.min(group.length*2,40);pass++){
   let improved=false;
   for(let a=0;a<best.length-1;a++)for(let b=a+1;b<best.length;b++){
    const candidate=[...best.slice(0,a),...best.slice(a,b+1).reverse(),...best.slice(b+1)];const nextCost=cost(candidate);
    if(nextCost+0.001<bestCost){best=candidate;bestCost=nextCost;improved=true;}
   }
   if(!improved)break;
  }
  if(bestCost+0.001<before){activities.splice(start,group.length,...best);savedKm+=before-bestCost;changed=true;}
 }
 return {day:changed?{...day,activities}:day,changed,savedKm,eligible};
}

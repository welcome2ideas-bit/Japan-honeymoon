import { localDay } from './today';
import type { Day, TripData, WishlistEntry } from '../types';
import { coordinates } from './wishlist';
import { distanceKm } from './nearby';
const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const city=(s:string)=>({tokyo:'tokio',kyoto:'kioto'}[normalize(s)]??normalize(s));
const minutes=(s:string)=>Number(s.slice(0,2))*60+Number(s.slice(3));
const blocks={Mañana:[9*60,12*60],Mediodía:[12*60,15*60],Tarde:[15*60,18*60],Noche:[18*60,21*60]};

export function integrateWishlist(data:TripData,wishlist:WishlistEntry[],now=new Date()) {
 const assigned=new Set(data.itinerary.flatMap(d=>d.activities.flatMap(a=>a.wishlistIds??[])));
 const knownNames=new Set(data.itinerary.flatMap(d=>d.activities.flatMap(a=>{const p=data.places.find(p=>p.id===a.placeId);return p?[`${normalize(p.name)}|${city(p.city)}`]:[]})));
 let added=0;
 const itinerary:Day[]=data.itinerary.map(d=>({...d,activities:d.activities.map(a=>({...a,wishlistIds:a.wishlistIds?[...a.wishlistIds]:undefined}))}));
 const candidates=wishlist.filter(p=>!assigned.has(p.id)&&!knownNames.has(`${normalize(p.name)}|${city(p.city)}`));
 // Fill declared free-time slots only. No additions on travel days or days with bookings.
 for(const d of itinerary){
  if(d.date<localDay(now,d.timeZone)||data.transport.some(t=>t.date===d.date)||d.activities.some(a=>a.start||a.end||a.reservation||a.locked))continue;
  const dayStops=d.activities.flatMap(a=>(a.wishlistIds??[]).flatMap(id=>wishlist.find(p=>p.id===id)??[]));
  for(const a of d.activities){
   if(!a.wishlistSlot||!a.suggestedBlock||a.completed||(a.wishlistIds?.length??0)>0||dayStops.length>=2)continue;
   const slot=a.wishlistSlot,window=blocks[a.suggestedBlock];
   const fixedAnchor=data.places.find(p=>p.id===slot.anchorPlaceId);
   const anchor=dayStops.find(coordinates)??(fixedAnchor&&coordinates(fixedAnchor)?fixedAnchor:undefined);
   if(slot.anchorPlaceId&&!anchor)continue;
   const ranked=candidates.filter(p=>!assigned.has(p.id)&&coordinates(p)&&city(p.city)===city(d.city)&&!p.closedDates?.includes(d.date)).flatMap(p=>{
    const reserve=(p.durationMinutes??90)+30; // Explicit planning allowance, never a claimed visit duration.
    if(reserve>slot.minutes)return [];
    const hours=p.openingHours?.filter(h=>h.date===d.date)??[];
    if(hours.length&&!hours.some(h=>Math.min(window[1],minutes(h.closes))-Math.max(window[0],minutes(h.opens))>=reserve))return [];
    const distance=anchor?distanceKm({latitude:anchor.latitude!,longitude:anchor.longitude!},{latitude:p.latitude!,longitude:p.longitude!}):0;
    if(anchor&&distance>2)return [];
    const priority=p.priority==='Imprescindible'?0:p.favorite?1:p.priority==='Si hay tiempo'?3:2;
    return [{p,distance,priority}];
   }).sort((a,b)=>a.distance-b.distance||a.priority-b.priority);
   if(ranked[0]){const p=ranked[0].p;a.wishlistIds=[p.id];assigned.add(p.id);dayStops.push(p);added++;}
  }
 }
 return {data:{...data,wishlist,itinerary},added,pending:candidates.filter(p=>!assigned.has(p.id)).length};
}

export function reviewItinerary(saved:TripData,fresh:TripData):TripData {
 if(saved.itineraryReviewRevision===1||saved.settings.startDate!==fresh.settings.startDate||saved.settings.endDate!==fresh.settings.endDate)return saved;
 return {...saved,itineraryReviewRevision:1,itinerary:saved.itinerary.map(d=>{
  const next=fresh.itinerary.find(x=>x.id===d.id);if(!next)return d;
  const activities=d.activities.map(a=>{const f=next.activities.find(x=>x.id===a.id);return f?{...a,suggestedBlock:f.suggestedBlock,planningNote:f.planningNote,optional:f.optional,wishlistSlot:f.wishlistSlot}:a;});
  if(['2026-11-30','2026-12-01'].includes(d.date)&&!activities.some(a=>a.start||a.end||a.reservation||a.locked||a.transportId||a.hotelId)){
   const rank=new Map(next.activities.map((a,i)=>[a.id,i]));activities.sort((a,b)=>(rank.get(a.id)??999)-(rank.get(b.id)??999));
  }
  return {...d,tips:[...new Set([...(d.tips??[]),...(next.tips??[])])],activities};
 })};
}

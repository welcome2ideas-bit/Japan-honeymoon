import type { TripData } from '../types';
export function updateCatalog(saved:TripData,fresh:TripData):TripData {
 if(saved.catalogRevision===4||saved.settings.startDate!==fresh.settings.startDate||saved.settings.endDate!==fresh.settings.endDate)return saved;
 return {...saved,catalogRevision:4,places:saved.places.map(p=>{
  const updated=fresh.places.find(f=>f.id===p.id);return updated?{...updated,favorite:p.favorite,status:p.status,note:p.note}:p;
 }),hotels:saved.hotels.map(h=>{const f=fresh.hotels.find(x=>x.id===h.id);return f?{...h,source:f.source??h.source,location:f.location,description:f.description,area:f.area,howToArrive:f.howToArrive,tips:f.tips,imageCredit:f.imageCredit}:h;}),itinerary:saved.itinerary.map(d=>{
 const f=fresh.itinerary.find(x=>x.id===d.id);return f?{...d,tips:f.tips,subtitle:f.subtitle,summary:f.summary,featuredPlaceId:f.featuredPlaceId,cities:f.cities,luggage:f.luggage,activities:d.activities.map(a=>{const updated=f.activities.find(x=>x.id===a.id);return updated?{...a,transportId:updated.transportId??a.transportId,suggestedBlock:a.suggestedBlock??updated.suggestedBlock,flexible:a.flexible??updated.flexible,locked:a.locked??updated.locked}:a;})}:d;
 }),tasks:saved.tasks.map(t=>({...fresh.tasks.find(f=>f.id===t.id),...t}))};
}

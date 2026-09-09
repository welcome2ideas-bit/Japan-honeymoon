import type { TripData } from '../types';

export function connectItinerary(data:TripData) {
 return data.itinerary.map(day=>({...day,activities:day.activities.map(activity=>{
  const flight=data.transport.find(t=>t.id===activity.transportId);
  return flight?{...activity,title:flight.type==='Vuelo'?`Vuelo ${flight.title}`:flight.title,start:flight.departureAt??activity.start,end:flight.arrivalAt??activity.end,departureTimeZone:flight.departureTimeZone,arrivalTimeZone:flight.arrivalTimeZone,note:flight.note,location:flight.location,durationMinutes:flight.durationMinutes}:activity;
 })}));
}

// Apply this confirmed update to the existing trip without resetting favorites or tasks.
export function mergeConfirmedTravel(saved:TripData, confirmed:TripData):TripData {
 if(saved.confirmedTravelRevision===1||saved.settings.startDate!==confirmed.settings.startDate||saved.settings.endDate!==confirmed.settings.endDate)return saved;
 const merge=<T extends {id:string}>(old:T[],fresh:T[])=>[...fresh,...old.filter(x=>!fresh.some(y=>y.id===x.id))];
 return {...saved,confirmedTravelRevision:1,hotels:merge(saved.hotels,confirmed.hotels),transport:merge(merge(confirmed.transport.filter(t=>t.type!=='Vuelo'),saved.transport),confirmed.transport.filter(t=>t.type==='Vuelo')),itinerary:saved.itinerary.map(day=>{
  const fresh=confirmed.itinerary.find(d=>d.id===day.id);if(!fresh)return day;
  const updates=fresh.activities.filter(a=>a.transportId||a.hotelId||a.id==='2026-12-03-2');
  return {...day,hotelId:fresh.hotelId,title:fresh.title,city:fresh.city,subtitle:fresh.subtitle,activities:[...day.activities.map(a=>{const update=updates.find(u=>u.id===a.id);return update?{...update,completed:a.completed}:a;}),...updates.filter(a=>!day.activities.some(old=>old.id===a.id))]};
 })};
}

import type { TripData, WishlistEntry } from '../types';
// Importing personal places never changes itinerary activities, even in legacy files.
export function integrateWishlist(data:TripData,wishlist:WishlistEntry[],_now?:Date) {
 return {data:{...data,wishlist},added:0,pending:wishlist.length};
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

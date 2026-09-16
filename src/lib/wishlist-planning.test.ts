import { expect, it } from 'vitest';
import { integrateWishlist, reviewItinerary } from './wishlist-planning';
import { parseTrip } from './import';
import { parseWishlistFile, mergeWishlist } from './wishlist';
import { connectItinerary } from './confirmed-travel';
import type { WishlistEntry } from '../types';
import settings from '../../data/trip.json';
import places from '../../data/places.json';
import itinerary from '../../data/itinerary.json';
import hotels from '../../data/hotels.json';
import transport from '../../data/transport.json';
import tasks from '../../data/checklist.json';
const real=()=>parseTrip(structuredClone({version:2,settings,places,itinerary,hotels,transport,tasks}));
const before=new Date('2026-09-09T12:00:00Z');
// Test-only candidates; never added to the real Wishlist.
const candidate=(id:string,extra:Partial<WishlistEntry>={}):WishlistEntry=>({id,name:`Prueba ${id}`,city:'Tokio',category:'Prueba',note:'',favorite:false,imageUrl:'',latitude:35.69,longitude:139.70,...extra});
it('validates V2.4 place references without requiring the whole catalog to be scheduled',()=>{
 const data=real(),ids=new Set(data.itinerary.flatMap(d=>d.activities.map(a=>a.placeId)));
 expect(data.places).toHaveLength(65);
 for(const id of ids)if(id)expect(data.places.some(p=>p.id===id),id).toBe(true);
 expect(data.itinerary.find(d=>d.date==='2026-12-01')?.city).toBe('Nikkō');
 for(const d of connectItinerary(data))for(const a of d.activities)if(!a.start&&!a.end)expect(Boolean(a.suggestedBlock||a.planningNote),a.id).toBe(true);
});
it('keeps all imported Wishlist entries separate from the V2.4 itinerary',()=>{
 const data=real(),copy=structuredClone(data),wishlist=Array.from({length:8},(_,i)=>candidate(String(i)));
 const result=integrateWishlist(data,wishlist,before);expect(result.added).toBe(0);expect(result.pending).toBe(8);expect(result.data.wishlist).toEqual(wishlist);
 expect(data.itinerary.flatMap(d=>d.activities).some(a=>a.wishlistSlot)).toBe(false);expect(data).toEqual(copy);
 expect(result.data.hotels).toEqual(data.hotels);expect(result.data.transport).toEqual(data.transport);
 expect(result.data.itinerary.map(d=>[d.city,d.hotelId,d.activities.map(a=>[a.id,a.start,a.end])])).toEqual(data.itinerary.map(d=>[d.city,d.hotelId,d.activities.map(a=>[a.id,a.start,a.end])]));
 const counts=result.data.itinerary.map(d=>[d.date,d.activities.flatMap(a=>a.wishlistIds??[]).length]).filter(x=>x[1]);expect(counts).toEqual([]);
 expect(integrateWishlist(result.data,wishlist,before).added).toBe(0);expect(()=>parseTrip(result.data)).not.toThrow();
});
it('keeps Wishlist separate even when coordinates and opening times are compatible',()=>{
 const data=real();data.itinerary=data.itinerary.filter(d=>d.date==='2026-11-30');
 const wishlist=[candidate('missing',{latitude:undefined}),candidate('closed',{closedDates:['2026-11-30']}),candidate('morning',{openingHours:[{date:'2026-11-30',opens:'09:00',closes:'12:00'}]}),candidate('long',{durationMinutes:150}),candidate('distant',{longitude:139.80})];
 expect(integrateWishlist(data,wishlist,before).added).toBe(0);
 expect(integrateWishlist(data,[candidate('fits',{openingHours:[{date:'2026-11-30',opens:'15:00',closes:'18:00'}]})],before).added).toBe(0);
});
it('does not add Wishlist stops to the Nikko day, past days or reserved days',()=>{
 const data=real();data.itinerary=data.itinerary.filter(d=>d.date==='2026-12-01');
 expect(integrateWishlist(data,[candidate('a'),candidate('b',{longitude:139.85})],before).added).toBe(0);
 expect(integrateWishlist(data,[candidate('a')],new Date('2026-12-03T00:00:00Z')).added).toBe(0);
 data.itinerary[0].activities[0].reservation='Reserva real';expect(integrateWishlist(data,[candidate('a')],before).added).toBe(0);
});
it('does not duplicate a catalog visit and enriches imports without losing personal choices',()=>{
 const data=real(),p=data.places.find(p=>p.city==='Tokio')!;
 expect(integrateWishlist(data,[candidate('existing',{name:p.name})],before).added).toBe(0);
 const old=candidate('saved',{latitude:undefined,longitude:undefined,note:'Mi nota',favorite:true});
 const merged=mergeWishlist([old],[candidate('incoming',{name:old.name,note:'Otra nota'})]);expect(merged).toHaveLength(1);expect(merged[0]).toMatchObject({id:'saved',note:'Mi nota',favorite:true,latitude:35.69});
});
it('migrates guidance once without overwriting a real reservation or personal state',()=>{
 const saved=real(),fresh=real(),d=saved.itinerary.find(d=>d.date==='2026-11-30')!;
 d.activities.reverse();d.activities[0].start='2026-11-30T18:30:00+09:00';d.activities[0].completed=true;
 const result=reviewItinerary(saved,fresh);expect(result.itinerary.find(x=>x.id===d.id)?.activities.map(a=>[a.id,a.start,a.completed])).toEqual(d.activities.map(a=>[a.id,a.start,a.completed]));
 expect(result.hotels).toEqual(saved.hotels);expect(result.transport).toEqual(saved.transport);expect(reviewItinerary(result,fresh)).toBe(result);
});
it('accepts optional CSV coordinates and validates date-specific opening information',()=>{
 expect(parseWishlistFile('Title,City,Latitude,Longitude,DurationMinutes\nPrueba,Tokio,35.69,139.7,60',true)[0]).toMatchObject({latitude:35.69,longitude:139.7,durationMinutes:60});
 expect(()=>parseWishlistFile(JSON.stringify([candidate('bad',{openingHours:[{date:'2026-11-31',opens:'09:00',closes:'18:00'}]})]))).toThrow();
});

it('never populates even a legacy insertion slot',()=>{
 const data=real();data.itinerary[0].activities[0].wishlistSlot={minutes:120,maxStops:1};
 const before=structuredClone(data.itinerary);const result=integrateWishlist(data,[candidate('personal')]);
 expect(result.data.itinerary).toEqual(before);expect(result.added).toBe(0);
});

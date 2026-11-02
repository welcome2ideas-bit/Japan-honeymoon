import { expect,it } from 'vitest';
import { parseTrip } from './import';
import { connectItinerary } from './confirmed-travel';
import settings from '../../data/trip.json';
import itinerary from '../../data/itinerary.json';
import places from '../../data/places.json';
import hotels from '../../data/hotels.json';
import transport from '../../data/transport.json';
import tasks from '../../data/checklist.json';
const data=()=>parseTrip(structuredClone({version:2,settings,itinerary,places,hotels,transport,tasks}));
it('connects bought bus times while preserving unknown transfer estimates',()=>{
 const d=data(),days=connectItinerary(d);
 const bus=days.flatMap(d=>d.activities).find(a=>a.transportId==='transport-6')!;
 expect(bus.movement).toMatchObject({mode:'Autobús',from:'Takayama Nohi Bus Center',to:'Shirakawa-go (Ogimachi)',estimatedDuration:undefined,bookingPending:undefined});
 expect(bus.start).toBe('2026-11-25T08:10:00+09:00');expect(bus.durationMinutes).toBe(50);
 expect(d.transport.find(t=>t.id==='transport-8')).toMatchObject({trainNumber:'HIDA 6',durationMinutes:148,departureAt:'2026-11-26T09:36:00+09:00',arrivalAt:'2026-11-26T12:04:00+09:00'});
 expect(days.flatMap(d=>d.activities).find(a=>a.transportId==='nikko-tokyo')?.movement?.estimatedDuration).toBeUndefined();
});
it('keeps taxi alternatives and optional transfers separate from train estimates',()=>{
 const activities=data().itinerary.flatMap(d=>d.activities);
 const arashiyama=activities.find(a=>a.id==='2026-11-23-v24-2')!.movement!;
 expect(arashiyama.estimatedDuration).toEqual({minMinutes:30,maxMinutes:40});
 expect(arashiyama.alternatives?.[0]).toMatchObject({mode:'Taxi',recommended:true});
 expect(arashiyama.alternatives?.[0].estimatedDuration).toBeUndefined();
 expect(activities.find(a=>a.id==='2026-11-23-v24-9')?.movement).toMatchObject({mode:'Taxi',optional:true});
 expect(activities.find(a=>a.id==='2026-11-30-v24-2')?.movement).toMatchObject({mode:'A pie',estimatedDuration:{minMinutes:10,maxMinutes:15}});
});
it('validates ranges, accepts missing estimates, and preserves structured data on import',()=>{
 const d=data();expect(parseTrip(structuredClone(d))).toEqual(d);
 const invalid=data();invalid.transport[0].estimatedDuration={minMinutes:60,maxMinutes:30};expect(()=>parseTrip(invalid)).toThrow('Duración aproximada');
 const bad=data();bad.itinerary[0].activities[0].movement={estimatedDuration:{minMinutes:NaN,maxMinutes:10}};expect(()=>parseTrip(bad)).toThrow('Duración aproximada');
});

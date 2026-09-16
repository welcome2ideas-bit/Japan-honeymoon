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
it('connects approximate transport ranges without creating confirmed durations or times',()=>{
 const d=data(),days=connectItinerary(d);
 const bus=days.flatMap(d=>d.activities).find(a=>a.transportId==='transport-6')!;
 expect(bus.movement).toMatchObject({mode:'Autobús',from:'Takayama',to:'Shirakawa-go',estimatedDuration:{minMinutes:45,maxMinutes:45},bookingPending:true});
 expect(bus.start).toBeNull();expect(bus.durationMinutes).toBeUndefined();
 expect(d.transport.find(t=>t.id==='transport-8')).toMatchObject({via:['Nagoya'],estimatedDuration:{minMinutes:315,maxMinutes:345}});
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

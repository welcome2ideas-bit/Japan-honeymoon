import { expect, it } from 'vitest';
import { parseTrip } from './import';
import { connectItinerary, mergeConfirmedTravel } from './confirmed-travel';
import { activityRange, getActivities } from './time';
import settings from '../../data/trip.json';
import places from '../../data/places.json';
import itinerary from '../../data/itinerary.json';
import hotels from '../../data/hotels.json';
import transport from '../../data/transport.json';
import tasks from '../../data/checklist.json';
const real=()=>parseTrip(structuredClone({version:2,settings,places,itinerary,hotels,transport,tasks}));

it('connects all four booked trains while keeping payment and future services pending',()=>{
 const data=real(),days=connectItinerary(data);
 const expected=[['transport-5','11:48','12:22','Vagón 4 · 10D y 10E'],['jr-hida-11','12:48','15:12','Vagón 3 · 3A y 3B'],['transport-8','09:36','12:04','Vagón 8 · 10C y 10D'],['jr-kodama-822','12:38','14:42','Vagón 12 · 10D y 10E']];
 for(const [id,departure,arrival,seat] of expected){
  const t=data.transport.find(t=>t.id===id)!;
  expect(t).toMatchObject({time:departure,arrivalTime:arrival,seat,status:'Reservado'});
  expect(t.reservation).toContain('verificar pago');
  const a=days.flatMap(d=>d.activities).find(a=>a.transportId===id)!;
  expect(a.start).toBe(t.departureAt);expect(a.end).toBe(t.arrivalAt);
  expect(a.movement?.bookingPending).toBeUndefined();
 }
 const nex=days.flatMap(d=>d.activities).find(a=>a.transportId==='narita-express')!;
 expect(nex.start).toBeFalsy();expect(nex.planningNote).toContain('13:08');
 const transfer=days.flatMap(d=>d.activities).find(a=>a.transportId==='odawara-ashinoyu')!;
 expect(transfer.movement?.bookingPending).toBeUndefined();
 expect(transfer.note).toContain('NO contratar alternativa');
 expect(JSON.stringify(data)).not.toMatch(/AEQ[0-9A-Z]+/);
});

it('connects six confirmed flights and six stays without fabricated endpoints',()=>{
 const data=real();const flights=data.transport.filter(t=>t.type==='Vuelo');
 expect(flights).toHaveLength(6);expect(data.hotels).toHaveLength(6);
 expect(flights.every(f=>f.status==='Confirmado')).toBe(true);
 expect(flights.filter(f=>!f.arrivalAt).map(f=>f.id)).toEqual(['transport-1','transport-11']);
 expect(connectItinerary(data).flatMap(d=>d.activities).filter(a=>flights.some(f=>f.id===a.transportId))).toHaveLength(6);
 const ground=connectItinerary(data).flatMap(d=>d.activities).filter(a=>a.transportId&&!flights.some(f=>f.id===a.transportId));
 expect(ground).toHaveLength(14);expect(ground.filter(a=>a.start&&a.end)).toHaveLength(4);expect(ground.filter(a=>!a.start).every(a=>!a.end&&!a.title.startsWith('Vuelo'))).toBe(true);
 expect(new Set(ground.map(a=>a.transportId)).size).toBe(14);
 expect(data.hotels.map(h=>[h.checkIn,h.checkOut])).toEqual([['2026-11-17','2026-11-18'],['2026-11-19','2026-11-21'],['2026-11-21','2026-11-24'],['2026-11-24','2026-11-26'],['2026-11-26','2026-11-27'],['2026-11-27','2026-12-03']]);
});

it('finds the current flight across midnight and shows both local clocks',()=>{
 const days=connectItinerary(real());
 const current=getActivities(days,new Date('2026-11-19T02:00:00+08:00')).current!;
 expect(current.transportId).toBe('transport-2');
 expect(activityRange(current)).toBe('18 nov · 11:20 (origen) – 19 nov · 06:50 (destino)');
 expect(getActivities(days,new Date('2026-11-19T11:00:00+08:00')).current?.transportId).toBe('flight-hkg-osaka');
 expect(getActivities(days,new Date('2026-12-03T19:00:00+09:00')).current?.transportId).toBe('transport-10');
 expect(getActivities(days,new Date('2026-12-04T01:00:00+08:00')).current?.transportId).toBe('flight-hkg-madrid');
 expect(getActivities(days,new Date('2026-11-17T19:00:00+01:00')).current).toBeUndefined();
});

it('preserves user favorites, task states and extra activities when updating saved data',()=>{
 const old=real();old.hotels=[];old.transport=[];old.places[0].favorite=true;old.tasks[0].status='Completado';
 const extra={id:'extra-test',title:'',category:'',note:'',location:''};old.itinerary[0].activities.push(extra);
 const updated=mergeConfirmedTravel(old,real());
 expect(updated.places[0].favorite).toBe(true);expect(updated.tasks[0].status).toBe('Completado');
 expect(updated.itinerary[0].activities).toContainEqual(extra);
 expect(updated.hotels).toHaveLength(6);
 expect(mergeConfirmedTravel(updated,real())).toBe(updated);
});

it('validates new optional times and remote photographs safely',()=>{
 const data=real();data.transport[0].departureTimeZone='invalid';expect(()=>parseTrip(data)).toThrow('Zona horaria');
 const image=real();image.hotels[0].imageUrl='javascript:invalid';expect(()=>parseTrip(image)).toThrow('HTTPS');
});

import { expect, it } from 'vitest';
import { parseTrip } from './import';
import { updateCatalog } from './catalog-update';
import { connectItinerary } from './confirmed-travel';
import { getActivities } from './time';
import settings from '../../data/trip.json';
import itinerary from '../../data/itinerary.json';
import places from '../../data/places.json';
import hotels from '../../data/hotels.json';
import transport from '../../data/transport.json';
import tasks from '../../data/checklist.json';
import guide from '../../data/ticket-guide.json';
const fresh=()=>parseTrip(structuredClone({version:2,settings,itinerary,places,hotels,transport,tasks,wishlist:[]}));

it('connects purchased buses and SPACIA X to the correct Japanese clocks and seats',()=>{
 const data=fresh(),days=connectItinerary(data);
 for(const [id,date,start,end,seat] of [
  ['transport-6','2026-11-25','08:10','09:00','Vehículo 01 · 1D y 2D'],
  ['transport-7','2026-11-25','15:45','16:35','Vehículo 01 · 5C y 5D'],
  ['tokyo-nikko','2026-12-01','07:50','09:39','Vagón 4 · 05A y 05B · Standard Seat'],
  ['nikko-tokyo','2026-12-01','17:44','19:35','Vagón 4 · 09C y 09D · Standard Seat']
 ]){
  const t=data.transport.find(t=>t.id===id)!;
  expect(t).toMatchObject({status:'Confirmado',seat,time:start,arrivalTime:end,departureTimeZone:'Asia/Tokyo'});
  const activity=days.flatMap(d=>d.activities).find(a=>a.transportId===id)!;
  expect(activity.start).toBe(`${date}T${start}:00+09:00`);
  expect(activity.end).toBe(`${date}T${end}:00+09:00`);
  expect(getActivities(days,new Date(`${date}T${start}:30+09:00`)).current?.transportId).toBe(id);
 }
 expect(guide.groups.find(g=>g.name==='Tobu · Nikkō')?.instructions).toContain('13.760 JPY');
 expect(guide.groups.find(g=>g.name==='Tobu · Nikkō')?.instructions).toContain('suplementos SPACIA X');
});

it('keeps unbought services and Yamato separate from confirmed reservations',()=>{
 const data=fresh();
 for(const id of ['kix-namba','transport-3','transport-4','odawara-ashinoyu','transport-9'])expect(data.transport.find(t=>t.id===id)?.departureAt).toBeFalsy();
 for(const id of ['kix-namba','transport-3','transport-4','odawara-ashinoyu'])expect(data.transport.find(t=>t.id===id)?.status).toBe('no requiere reserva');
 expect(data.tasks.find(t=>t.id==='v24-task-12')).toMatchObject({status:'Pendiente',recommendedDate:'2026-11-30'});
 expect(data.tasks.find(t=>t.id==='jr-pickup-2026')?.note).toContain('FUERA de los tornos');
 expect(data.tasks.find(t=>t.id==='jr-pickup-2026')?.note).toContain('JR Osaka Station');
 expect(data.tasks.find(t=>t.id==='jr-pickup-2026')?.status).toBe('Pendiente');
 expect(data.tasks.find(t=>t.id==='shipping-handover-2026')).toMatchObject({status:'Pendiente',recommendedDate:'2026-11-25'});
 expect(data.tasks.find(t=>t.id==='shipping-handover-2026')?.note).toContain('NO contratado, NO pagado y NO entregado');
 const nara=data.itinerary.find(d=>d.date==='2026-11-21')!;
 expect(nara.activities.find(a=>a.transportId==='transport-3')?.planningNote).toContain('07:30–07:45');
 expect(nara.activities.find(a=>a.transportId==='transport-4')?.planningNote).toContain('15:30–15:45');
 expect(nara.activities.find(a=>a.id==='2026-11-21-store-luggage')?.note).toContain('SEIS bultos reales');
 const ids=data.itinerary.flatMap(d=>d.activities.map(a=>a.id));expect(new Set(ids).size).toBe(ids.length);
 expect(new Set(data.tasks.map(t=>t.id)).size).toBe(data.tasks.length);
});

it('updates only the newly confirmed task states once and preserves personal progress',()=>{
 const saved=fresh();saved.catalogRevision=6;
 for(const id of ['v24-task-5','v24-task-11','jr-payments-2026'])saved.tasks.find(t=>t.id===id)!.status='Pendiente';
 saved.tasks.find(t=>t.id==='v24-task-16')!.status='Completado';
 saved.tasks.push({id:'personal-task',title:'Mi gestión',category:'Personal',status:'Reservado',note:'Conservar'});
 saved.deletedTaskIds=['v24-task-17'];saved.places[0].note='Mi nota';saved.places[0].favorite=true;
 saved.itinerary[0].activities[0].completed=true;
 saved.wishlist=[{id:'personal-place',name:'Mi lugar',city:'Tokio',category:'Personal',note:'Mi nota',favorite:true,imageUrl:''}];
 const updated=updateCatalog(saved,fresh());
 for(const id of ['v24-task-5','v24-task-11','jr-payments-2026'])expect(updated.tasks.find(t=>t.id===id)?.status).toBe('Completado');
 expect(updated.tasks.find(t=>t.id==='personal-task')).toEqual(saved.tasks.find(t=>t.id==='personal-task'));
 expect(updated.tasks.find(t=>t.id==='v24-task-16')?.status).toBe('Completado');
 expect(updated.tasks.some(t=>t.id==='v24-task-17')).toBe(false);
 expect(updated.wishlist).toEqual(saved.wishlist);expect(updated.places[0]).toMatchObject({note:'Mi nota',favorite:true});
 expect(updated.itinerary[0].activities[0].completed).toBe(true);
 expect(updateCatalog(updated,fresh())).toBe(updated);
 updated.tasks.find(t=>t.id==='v24-task-5')!.status='Pendiente';
 expect(updateCatalog(updated,fresh()).tasks.find(t=>t.id==='v24-task-5')?.status).toBe('Pendiente');
});

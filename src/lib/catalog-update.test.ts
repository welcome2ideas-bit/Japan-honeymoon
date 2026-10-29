import { expect, it } from 'vitest';
import { parseTrip } from './import';
import { updateCatalog } from './catalog-update';
import itinerary from '../../data/itinerary.json';
import places from '../../data/places.json';
import hotels from '../../data/hotels.json';
import transport from '../../data/transport.json';
import tasks from '../../data/checklist.json';
import settings from '../../data/trip.json';
const fresh=()=>parseTrip(structuredClone({version:2,settings,itinerary,places,hotels,transport,tasks,wishlist:[]}));
it('replaces cached content even with the previous revision, preserving personal progress',()=>{
 const current=fresh(),saved=fresh();saved.catalogRevision=4;
 saved.itinerary[0].title='Antiguo';saved.itinerary[0].activities[0].completed=true;
 saved.places[0].favorite=true;saved.places[0].status='visitado';saved.tasks[0].status='Completado';
 saved.transport[0].title='Antiguo';saved.hotels[0].name='Antiguo';
 saved.wishlist=[{id:'personal',name:'Personal',city:'',category:'',note:'Nota personal',favorite:true,imageUrl:''}];
 const result=updateCatalog(saved,current);
 expect(result.itinerary[0].title).toBe(current.itinerary[0].title);
 expect(result.itinerary[0].activities[0].completed).toBe(true);
 expect(result.transport).toEqual(current.transport);expect(result.hotels).toEqual(current.hotels);
 expect(result.places[0].favorite).toBe(true);expect(result.places[0].status).toBe('visitado');
 expect(result.tasks[0].status).toBe('Completado');expect(result.wishlist).toEqual(saved.wishlist);
 expect(updateCatalog(result,current)).toEqual(result);
 const newer=fresh();newer.itinerary[0].title='Actualización siguiente';
 expect(updateCatalog(result,newer).itinerary[0].title).toBe('Actualización siguiente');
 expect(()=>parseTrip(result)).not.toThrow();
});
it('does not restore removed activities or Wishlist slots from storage',()=>{
 const current=fresh(),saved=fresh();saved.itinerary[0].activities.push({...saved.itinerary[0].activities[0],id:'obsolete',wishlistSlot:{minutes:120,maxStops:1}});
 const result=updateCatalog(saved,current);
 expect(result.itinerary).toEqual(current.itinerary);
});
it('keeps the bus arrival unchanged and separates the suggested viewpoint visit',()=>{
 const day=fresh().itinerary.find(d=>d.date==='2026-11-25')!;
 expect(day.activities.find(a=>a.transportId==='transport-6')?.planningNote).toContain('09:40');
 const visit=day.activities.find(a=>a.placeId==='shiroyama')!;
 expect(visit.planningNote).toContain('10:00');expect(visit.start).toBeNull();
});

it('preserves personal tasks, deletion markers and notes across successive JSON updates',()=>{
 const saved=updateCatalog(fresh(),fresh());const removed=saved.tasks.shift()!;
 saved.deletedTaskIds=[removed.id];saved.tasks.push({id:'personal-task',title:'Personal',category:'Personal',status:'Pendiente'});
 saved.places[0].note='Mi nota';
 const reload=parseTrip(JSON.parse(JSON.stringify(updateCatalog(saved,fresh()))));
 const again=updateCatalog(reload,fresh());
 expect(again.tasks.some(t=>t.id===removed.id)).toBe(false);
 expect(again.tasks.find(t=>t.id==='personal-task')?.title).toBe('Personal');
 expect(again.places[0].note).toBe('Mi nota');
});

it('retires only the two obsolete purchase tasks even in legacy storage',()=>{
 const saved=fresh();saved.officialTaskIds=undefined;
 saved.tasks.push({id:'v24-task-3',title:'Comprar tren antiguo',category:'Transporte',status:'Pendiente'},
  {id:'v24-task-6',title:'Comprar otro tren antiguo',category:'Transporte',status:'Pendiente'},
  {id:'my-personal-train-task',title:'Mi gestión de trenes',category:'Personal',status:'Pendiente'});
 const result=updateCatalog(saved,fresh());
 expect(result.tasks.some(t=>['v24-task-3','v24-task-6'].includes(t.id))).toBe(false);
 expect(result.tasks.some(t=>t.id==='my-personal-train-task')).toBe(true);
 expect(result.tasks.some(t=>t.id==='jr-payments-2026')).toBe(true);
 expect(result.tasks.some(t=>t.id==='jr-pickup-2026')).toBe(true);
});

it('applies the paid Nara booking once and preserves other tasks and personal data',()=>{
 const saved=fresh();saved.catalogRevision=5;
 saved.tasks.find(t=>t.id==='v24-task-2')!.status='Pendiente';
 saved.tasks.find(t=>t.id==='jr-payments-2026')!.status='Completado';
 saved.tasks.push({id:'personal-nara',title:'Mi nota de Nara',category:'Personal',status:'Pendiente',note:'Conservar esta gestión'});
 saved.deletedTaskIds=['v24-task-16'];saved.places[0].note='Nota personal';saved.places[0].favorite=true;
 saved.wishlist=[{id:'wish',name:'Favorito',city:'Nara',category:'Personal',note:'Mi nota',favorite:true,imageUrl:''}];
 saved.itinerary[0].activities[0].completed=true;
 const result=updateCatalog(saved,fresh());
 expect(result.catalogRevision).toBe(6);
 expect(result.tasks.find(t=>t.id==='v24-task-2')?.status).toBe('Completado');
 expect(result.tasks.find(t=>t.id==='jr-payments-2026')?.status).toBe('Completado');
 expect(result.tasks.find(t=>t.id==='personal-nara')).toEqual(saved.tasks.find(t=>t.id==='personal-nara'));
 expect(result.tasks.some(t=>t.id==='v24-task-16')).toBe(false);
 expect(result.places[0]).toMatchObject({note:'Nota personal',favorite:true});
 expect(result.wishlist).toEqual(saved.wishlist);expect(result.itinerary[0].activities[0].completed).toBe(true);
 for(const id of ['nara-deposit-2026','nara-collect-2026'])expect(result.tasks.find(t=>t.id===id)?.status).toBe('Pendiente');
 expect(updateCatalog(result,fresh())).toEqual(result);
 result.tasks.find(t=>t.id==='nara-deposit-2026')!.status='Completado';
 expect(updateCatalog(result,fresh()).tasks.find(t=>t.id==='nara-deposit-2026')?.status).toBe('Completado');
});

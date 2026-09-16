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
 expect(day.activities.find(a=>a.transportId==='transport-6')?.planningNote).toContain('09:35');
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

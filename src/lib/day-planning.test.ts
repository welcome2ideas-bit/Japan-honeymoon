import { expect, it } from 'vitest';
import type { Activity, Day, Place } from '../types';
import { dayProgress, optimizeDay, tripPhase } from './day-planning';
import { activityRange } from './time';
import { parseTrip } from './import';
import { connectItinerary } from './confirmed-travel';
import { updateCatalog } from './catalog-update';
import settings from '../../data/trip.json';
import places from '../../data/places.json';
import itinerary from '../../data/itinerary.json';
import hotels from '../../data/hotels.json';
import transport from '../../data/transport.json';
import tasks from '../../data/checklist.json';
const real=()=>parseTrip(structuredClone({version:2,settings,places,itinerary,hotels,transport,tasks}));
// Synthetic points belong only to this unit test, never to the trip catalog.
const point=(id:string,longitude:number):Place=>({id,name:id,city:'Test',category:'Visita',note:'',favorite:false,status:'pendiente',imageUrl:'',gallery:[],curiosities:[],nearbyPlaceIds:[],latitude:0,longitude});
const visit=(id:string):Activity=>({id,placeId:id,title:id,location:'',category:'Visita',note:'',flexible:true,suggestedBlock:'Mañana'});
const day=(activities:Activity[]):Day=>({id:'test',date:'2026-11-20',city:'Test',title:'',subtitle:'',activities});
it('reduces backtracking without mutating activity data or the input day',()=>{
 const points=[point('a',0),point('b',3),point('c',1),point('d',4)];const input=day(points.map(p=>visit(p.id))),copy=structuredClone(input);
 const result=optimizeDay(input,points);expect(result.changed).toBe(true);expect(result.savedKm).toBeGreaterThan(0);expect(input).toEqual(copy);
 expect([...result.day.activities].sort((a,b)=>a.id.localeCompare(b.id))).toEqual([...input.activities].sort((a,b)=>a.id.localeCompare(b.id)));
 expect(optimizeDay(result.day,points).changed).toBe(false);
});
it('keeps confirmed times, reservations, transport and completed visits fixed',()=>{
 const points=Array.from({length:8},(_,i)=>point(String(i),[0,3,1,4,7,5,8,9][i]));
 for(const protection of [{start:'2026-11-20T10:00:00+09:00'},{end:'2026-11-20T11:00:00+09:00'},{reservation:'Reservado'},{transportId:'train'},{hotelId:'hotel'},{locked:true},{completed:true},{category:'Transporte'}]){
  const activities=points.map(p=>visit(p.id));activities[3]={...activities[3],...protection};const input=day(activities);const result=optimizeDay(input,points);
  expect(result.day.activities[3]).toEqual(input.activities[3]);expect(new Set(result.day.activities.slice(0,3).map(a=>a.id))).toEqual(new Set(['0','1','2']));
 }
});
it('never crosses city, block, visited-place or missing-coordinate barriers',()=>{
 const points=[point('a',0),point('b',3),point('c',1),point('d',4)];
 const activities=points.map(p=>visit(p.id));activities[2].suggestedBlock='Tarde';const result=optimizeDay(day(activities),points);expect(result.day.activities[2]).toEqual(activities[2]);expect(new Set(result.day.activities.slice(0,2).map(a=>a.id))).toEqual(new Set(['a','b']));
 for(const change of [{city:'Otra ciudad'},{latitude:null,longitude:null},{status:'visitado' as const}]){
  const modified=points.map(p=>p.id==='b'?{...p,...change}:p);expect(optimizeDay(day(points.map(p=>visit(p.id))),modified).day.activities[1].id).toBe('b');
 }
 expect(optimizeDay(day([]),[]).changed).toBe(false);
});
it('uses local trip boundaries and never marks unvisited plans complete after the end date',()=>{
 const trip=real();expect(tripPhase(trip.settings,trip.itinerary,new Date('2026-11-16T23:30:00+01:00'))).toEqual({phase:'before',remaining:1});
 expect(tripPhase(trip.settings,trip.itinerary,new Date('2026-12-04T23:30:00+01:00')).phase).toBe('during');
 expect(tripPhase(trip.settings,trip.itinerary,new Date('2026-12-05T00:30:00+01:00')).phase).toBe('after');
 expect(dayProgress(trip.itinerary[0],trip.places).status).toBe('Pendiente');
 const complete={...trip.itinerary[0],activities:trip.itinerary[0].activities.map(a=>({...a,completed:true}))};expect(dayProgress(complete,trip.places).status).toBe('Completado');
});
it('labels suggestions separately and protects all real flight and ground endpoints',()=>{
 const trip=real(),days=connectItinerary(trip);for(const d of days){expect(d.tips?.length).toBeGreaterThan(0);const optimized=optimizeDay(d,trip.places).day;
  d.activities.forEach((a,index)=>{if(a.transportId||a.start||a.end||a.hotelId||a.locked)expect(optimized.activities[index]).toEqual(a);if(a.transportId&&!a.start&&!a.end)expect(activityRange(a)).toBe('Pendiente de confirmar');});
 }
 expect(activityRange(visit('test'))).toBe('Horario orientativo · Mañana');
 const migrated=updateCatalog({...trip,catalogRevision:3},real());expect(migrated.catalogRevision).toBe(6);expect(migrated.transport).toEqual(trip.transport);
});
it('allows full progress while a hidden transition remains unchecked',()=>{
 const day=real().itinerary.find(d=>d.date==='2026-11-20')!;
 day.activities=day.activities.map(a=>({...a,completed:!a.title.startsWith('Salida del castillo')}));
 const result=dayProgress(day,[]);expect(result.status).toBe('Completado');expect(result.completed).toBe(result.total);
});

import { afterEach, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { parseWishlistFile, validateWishlist, mergeWishlist } from './wishlist';
import { distanceKm, findNearby } from './nearby';
import { todayPlan, countdown } from './today';
import { parseTrip } from './import';
import { connectItinerary } from './confirmed-travel';
import { updateCatalog } from './catalog-update';
import { TripProvider } from '../context';
import Now from '../pages/Now';
import settings from '../../data/trip.json';
import places from '../../data/places.json';
import itinerary from '../../data/itinerary.json';
import hotels from '../../data/hotels.json';
import transport from '../../data/transport.json';
import tasks from '../../data/checklist.json';
const data=()=>parseTrip(structuredClone({version:2,settings,places,itinerary,hotels,transport,tasks}));
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();});
it.each([['2026-11-16T12:00:00+01:00','1 día para el viaje'],['2026-12-05T12:00:00+01:00','Viaje completado.']])('renders Now outside the travel dates: %s',(date,expected)=>{
 vi.useFakeTimers();vi.setSystemTime(new Date(date));
 const html=renderToString(createElement(TripProvider,{children:createElement(MemoryRouter,{children:createElement(Now)})}));
 expect(html).toContain(expected);expect(html).not.toContain('EN ESTE MOMENTO');
});
it('imports quoted Google Maps CSV and preserves an empty city',()=>{
 const list=parseWishlistFile('Title,Note,URL\r\n"Sensō-ji","Una nota, con coma",https://www.google.com/maps/search/?api=1&query=Sensoji',true);
 expect(list[0].name).toBe('Sensō-ji');expect(list[0].note).toBe('Una nota, con coma');expect(list[0].city).toBe('');expect(list[0].latitude).toBeUndefined();
});
it('imports GeoJSON coordinates in longitude, latitude order',()=>{
 const list=parseWishlistFile(JSON.stringify({type:'FeatureCollection',features:[{properties:{Title:'Dotonbori'},geometry:{type:'Point',coordinates:[135.501308,34.668708]}}]}));
 expect(list[0].latitude).toBe(34.668708);expect(list[0].longitude).toBe(135.501308);
});
it('rejects invalid coordinates, unsafe URLs and malformed CSV without partial import',()=>{
 expect(()=>validateWishlist([{name:'Lugar',latitude:999,longitude:0}])).toThrow('coordenadas');
 expect(()=>validateWishlist([{name:'Lugar',mapsUrl:'https://google.com.evil.test/maps'}])).toThrow('Google Maps');
 expect(()=>parseWishlistFile('Title,Note\n"unfinished',true)).toThrow('comillas');
});
it('keeps Wishlist separate and avoids duplicate imports',()=>{
 const trip=data();const list=validateWishlist([{name:'Sensō-ji',city:'Tokio'}]);
 const merged=mergeWishlist(list,list);expect(merged).toHaveLength(1);
 const restored=parseTrip(JSON.parse(JSON.stringify({...trip,wishlist:merged})));
 expect(restored.places).toEqual(trip.places);expect(restored.itinerary).toEqual(trip.itinerary);expect(restored.wishlist).toEqual(merged);
});
it('sorts nearby places by distance and omits unknown coordinates and visited sites',()=>{
 const origin={latitude:34.668708,longitude:135.501308};
 const list=findNearby(origin,data().places,[],500);
 expect(list.length).toBeGreaterThan(1);expect(list[0].id).toBe('dotonbori');
 expect(list.every((p,i)=>i===0||p.distance>=list[i-1].distance)).toBe(true);
 const visited=data().places.map(p=>({...p,status:'visitado' as const}));expect(findNearby(origin,visited,[])).toEqual([]);
 expect(distanceKm(origin,origin)).toBe(0);
 expect(findNearby(origin,data().places,[],500,true)).toEqual([]);
});
it('calculates the day without inventing current unscheduled activities or completed plans',()=>{
 const trip=data(),days=connectItinerary(trip);const result=todayPlan(days,trip.places,new Date('2026-11-26T10:00:00+09:00'));
 expect(result.day?.date).toBe('2026-11-26');expect(result.current?.title).toContain("HIDA 6");expect(result.currentTiming).toBe("confirmed");expect(result.current?.start).toBe("2026-11-26T09:36:00+09:00");expect(result.completed).toBe(0);expect(result.featured).toBeDefined();
 expect(todayPlan(days,trip.places,new Date('2026-09-09T10:00:00+09:00')).day).toBeUndefined();
 expect(countdown(null,new Date())).toBe('Pendiente de confirmar');
});
it('renders the travel day with hotel, baggage, food and no geolocation request on mount',()=>{
 vi.useFakeTimers();vi.setSystemTime(new Date('2026-11-26T10:00:00+09:00'));
 const getCurrentPosition=vi.fn();vi.stubGlobal('navigator',{geolocation:{getCurrentPosition}});
 const html=renderToString(createElement(TripProvider,{children:createElement(MemoryRouter,{children:createElement(Now)})}));
 for(const value of ['Matsuzakaya Honten','Equipaje','Qué comer hoy','Hoba miso','Pendiente de confirmar'])expect(html).toContain(value);
 expect(getCurrentPosition).not.toHaveBeenCalled();
});
it('all attached Wikimedia images have attribution and HTTPS source and license',()=>{
 for(const place of data().places)for(const img of place.gallery){expect(img.credit).toBeTruthy();expect(img.source).toMatch(/^https:\/\/commons.wikimedia.org/);expect(img.license).toBeTruthy();expect(img.licenseUrl).toMatch(/^https:\/\//);}
});
it('keeps completion, favorites and user notes when applying catalog content',()=>{
 const saved=data();saved.catalogRevision=1;saved.places[0].favorite=true;saved.places[0].note='Nota guardada';saved.itinerary[0].activities[0].completed=true;saved.tasks[0].status='Completado';
 const result=parseTrip(updateCatalog(saved,data()));
 expect(result.places[0].favorite).toBe(true);expect(result.places[0].note).toBe('Nota guardada');expect(result.itinerary[0].activities[0].completed).toBe(true);expect(result.tasks[0].status).toBe('Completado');expect(updateCatalog(result,data())).toBe(result);
});
it('each real day has a valid featured place and new V2.4 places allow unconfirmed details',()=>{
 const trip=data();for(const day of trip.itinerary){expect(day.summary?.length).toBeGreaterThan(40);expect(trip.places.some(p=>p.id===day.featuredPlaceId)).toBe(true);}
 const pending=['amerikamura','umeda','kasuga','higashiyama','togetsukyo','otagi','monkey-park','omotesando','metropolitan','tsukiji','ginza','nikko','nakano','daikoku'];
 expect(trip.places.filter(p=>!p.description).map(p=>p.id)).toEqual(pending);
 for(const place of trip.places){
  if(pending.includes(place.id)){expect(place.note).toContain('pendientes de confirmar');expect(place.imageUrl).toBe('');expect(place.gallery).toEqual([]);expect(place.curiosities).toEqual([]);expect(place.bestTime).toBeUndefined();}
  else {expect(place.description).toBeTruthy();expect(place.curiosities.length).toBeGreaterThan(0);expect(place.bestTime).toBeTruthy();}
 }
});
it('keeps confirmed flights ahead of approximate plans without changing their timestamps',()=>{
 const trip=data(),days=connectItinerary(trip),before=JSON.stringify(days);
 const result=todayPlan(days,trip.places,new Date('2026-11-19T12:00:00+08:00'));
 expect(result.current?.transportId).toBe('flight-hkg-osaka');expect(result.currentTiming).toBe('confirmed');
 expect(JSON.stringify(days)).toBe(before);
 const morning=todayPlan(days,trip.places,new Date('2026-11-26T07:00:00+09:00'));
 expect(morning.nextTiming).toBe('estimated');expect(morning.nextAt).toBeTruthy();expect(morning.next?.start).toBeFalsy();
});

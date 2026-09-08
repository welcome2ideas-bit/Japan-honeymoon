import { describe,it,expect } from 'vitest';
import { parseTrip } from './import';
import template from '../../data/import-template.json';
function fixture(){return {...structuredClone(template),places:[{id:'test-a',name:'A',city:'Ciudad A',category:'',note:'',favorite:false,status:'pendiente',imageUrl:'https://example.org/a.jpg',gallery:[],curiosities:[],nearbyPlaceIds:[] as string[]}],itinerary:[{id:'test-day',date:'2026-11-01',city:'Ciudad A',title:'Prueba',subtitle:'',activities:[{id:'test-activity',title:'Prueba',start:'2026-11-01T09:00:00+09:00',end:'2026-11-01T10:00:00+09:00',location:'',category:'',note:'',placeId:'test-a'}]}]};}
describe('Versioned trip import',()=>{
 it('accepts an empty trip with no invented dates',()=>expect(parseTrip(template).places).toEqual([]));
 it('accepts linked activities and remote covers',()=>expect(parseTrip(fixture()).places[0].imageUrl).toContain('https://'));
 it('rejects local images and unsafe schemes',()=>{for(const src of ['./image.jpg','javascript:alert(1)','http://example.org/image.jpg']){const data=fixture();data.places[0].imageUrl=src;expect(()=>parseTrip(data)).toThrow('HTTPS');}});
 it('rejects missing place references and duplicate IDs',()=>{const data=fixture();data.itinerary[0].activities[0].placeId='missing';expect(()=>parseTrip(data)).toThrow('placeId');const duplicate=fixture();duplicate.places.push(duplicate.places[0]);expect(()=>parseTrip(duplicate)).toThrow('único');});
 it('rejects invalid dates and reversed times',()=>{const data=fixture();data.itinerary[0].date='2026-02-30';expect(()=>parseTrip(data)).toThrow('fecha');const times=fixture();times.itinerary[0].activities[0].end=times.itinerary[0].activities[0].start;expect(()=>parseTrip(times)).toThrow('posterior');});
 it('rejects dangling nearby links',()=>{const data=fixture();data.places[0].nearbyPlaceIds=['missing'];expect(()=>parseTrip(data)).toThrow('cercana');});
 it('rejects malformed optional content',()=>{expect(()=>parseTrip({...fixture(),places:[{...fixture().places[0],durationMinutes:-2}]})).toThrow('duración');expect(()=>parseTrip({...fixture(),places:[{...fixture().places[0],gallery:[{src:'./a.jpg',alt:''}]}]})).toThrow('galería');});
});

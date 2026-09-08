import { describe, expect, it } from 'vitest';
import { daysUntil, getActivities, japanDate, mapUrl } from './time';
import type { Day } from '../types';
const days:Day[]=[{id:'day',date:'2026-11-09',city:'Tokio',title:'Test',subtitle:'',activities:[{id:'a',title:'A',start:'2026-11-09T09:00:00+09:00',end:'2026-11-09T10:00:00+09:00',location:'Tokyo',category:'Test',note:''},{id:'b',title:'B',start:'2026-11-09T11:00:00+09:00',end:'2026-11-09T12:00:00+09:00',location:'Kyoto',category:'Test',note:''}]}];
describe('Japanese travel time',()=>{
it('uses the Japanese date across midnight',()=>{expect(japanDate(new Date('2026-11-08T16:00:00Z'))).toBe('2026-11-09');expect(daysUntil('2026-11-09',new Date('2026-11-08T16:00:00Z'))).toBe(0);});
it('finds the current and next activities',()=>{const state=getActivities(days,new Date('2026-11-09T00:30:00Z'));expect(state.current?.id).toBe('a');expect(state.next?.id).toBe('b');});
it('starts exactly on time and ends exclusively',()=>{expect(getActivities(days,new Date('2026-11-09T00:00:00Z')).current?.id).toBe('a');expect(getActivities(days,new Date('2026-11-09T01:00:00Z')).current).toBeUndefined();});
it('handles before, after, and empty itineraries',()=>{expect(getActivities(days,new Date('2026-01-01')).next?.id).toBe('a');expect(getActivities(days,new Date('2027-01-01')).next).toBeUndefined();expect(getActivities([],new Date()).current).toBeUndefined();});
it('encodes Maps locations safely',()=>expect(mapUrl('Café & Tokio')).toBe('https://www.google.com/maps/search/?api=1&query=Caf%C3%A9%20%26%20Tokio'));
});

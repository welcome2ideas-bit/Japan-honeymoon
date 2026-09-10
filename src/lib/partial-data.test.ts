import { describe,it,expect } from 'vitest';
import { parseTrip } from './import';
import { activityRange,dateLabel,timeLabel,getActivities,pendingLabel,durationLabel } from './time';
import trip from '../../data/trip.json';
import places from '../../data/places.json';
import itinerary from '../../data/itinerary.json';
import hotels from '../../data/hotels.json';
import transport from '../../data/transport.json';
import tasks from '../../data/checklist.json';
const real=()=>structuredClone({version:2,settings:trip,places,itinerary,hotels,transport,tasks});
describe('Partial real trip data',()=>{
 it('accepts the real dataset without changing it',()=>{const input=real();expect(parseTrip(input)).toEqual(input);});
 it.each([null,'',undefined,'   '])('accepts missing travel details: %s',blank=>{
  const input:Record<string,unknown>=real();
  input.itinerary=[{...itinerary[0],activities:[{...itinerary[0].activities[0],start:blank,end:blank}]}];
  input.transport=[{...transport[0],date:blank,time:blank,status:blank,trainNumber:blank,platform:blank,seat:blank,reservation:blank,durationMinutes:blank}];
  input.hotels=[{...hotels[0],checkIn:blank,checkOut:blank,status:blank,reservation:blank}];
  expect(()=>parseTrip(input)).not.toThrow();
 });
 it('accepts only one confirmed endpoint and does not infer current activity',()=>{
  const input=real();const activity={...input.itinerary[0].activities[0],start:'2026-11-17T09:00:00+01:00',end:null};
  const data=parseTrip({...input,itinerary:[{...input.itinerary[0],activities:[activity]}]});
  expect(getActivities(data.itinerary,new Date('2026-11-17T08:30:00Z')).current).toBeUndefined();
  expect(activityRange(data.itinerary[0].activities[0],'Europe/Madrid')).toBe('09:00 – Pendiente de confirmar');
 });
 it('ignores unscheduled activities and avoids epoch or invalid date displays',()=>{
  const data=parseTrip(real());expect(getActivities(data.itinerary,new Date('2026-11-19T10:00:00+09:00'))).toEqual({current:undefined,next:undefined});
  expect(activityRange(data.itinerary[0].activities[0])).toBe('Pendiente de confirmar');
  for(const value of [null,undefined,'','invalid']){expect(dateLabel(value)).toBe('Pendiente de confirmar');expect(timeLabel(value)).toBe('Pendiente de confirmar');}
  expect(pendingLabel(null)).toBe('Pendiente de confirmar');expect(durationLabel(null)).toBe('Pendiente de confirmar');expect(durationLabel(45)).toBe('45 min');
 });
 it('still rejects actual malformed values',()=>{
  const input=real();expect(()=>parseTrip({...input,transport:[{...transport[0],durationMinutes:-1}]})).toThrow('duración');
  expect(()=>parseTrip({...input,itinerary:[{...itinerary[0],activities:[{...itinerary[0].activities[0],start:'not a date'}]}]})).toThrow('fechas');
 });
});

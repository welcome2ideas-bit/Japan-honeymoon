import type { Activity, Day } from '../types';
export function getActivities(days: Day[], now: Date) {
  const activities = days.flatMap(day => day.activities).filter((a): a is Activity & {start:string} => validTime(a.start)).sort((a,b) => Date.parse(a.start)-Date.parse(b.start));
  return {current: activities.find(a => validTime(a.end)&&Date.parse(a.start)<=+now && +now<Date.parse(a.end)), next: activities.find(a=>Date.parse(a.start)>+now)};
}
export const PENDING='Pendiente de confirmar';
export function pendingLabel(value:string|null|undefined){return typeof value==='string'&&value.trim()?value:PENDING;}
export function durationLabel(value:number|''|null|undefined){return typeof value==='number'&&Number.isFinite(value)&&value>0?`${value} min`:PENDING;}
function validTime(value:unknown):value is string{return typeof value==='string'&&value.trim()!==''&&Number.isFinite(Date.parse(value));}
export function japanDate(now: Date) { return new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).format(now); }
export function daysUntil(date: string, now: Date) { return Math.ceil((Date.parse(date)-Date.parse(japanDate(now)))/86400000); }
export function dateLabel(date?: string|null) { if(!validTime(date))return PENDING;return new Intl.DateTimeFormat('es-ES',{day:'numeric',month:'short',timeZone:'UTC'}).format(new Date(date.slice(0,10)+'T12:00:00Z')); }
export function timeLabel(date?: string|null,timeZone='Asia/Tokyo') { if(!validTime(date))return PENDING;return new Intl.DateTimeFormat('es-ES',{hour:'2-digit',minute:'2-digit',timeZone}).format(new Date(date)); }
export function activityRange(activity: Activity,timeZone='Asia/Tokyo') { if(!validTime(activity.start)&&!validTime(activity.end))return activity.suggestedBlock&&!activity.transportId&&!activity.hotelId&&!activity.reservation?`Horario orientativo · ${activity.suggestedBlock}`:PENDING;if(activity.departureTimeZone)return `${dateLabel(activity.start)} · ${timeLabel(activity.start,activity.departureTimeZone)} (origen) – ${validTime(activity.end)?dateLabel(activity.end)+' · '+timeLabel(activity.end,activity.arrivalTimeZone??activity.departureTimeZone)+' (destino)':PENDING}`;return `${timeLabel(activity.start,timeZone)} – ${timeLabel(activity.end,timeZone)}`; }
export function mapUrl(location: string) { return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`; }

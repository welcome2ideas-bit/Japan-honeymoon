import type { Activity, Day } from '../types';
export function getActivities(days: Day[], now: Date) {
  const activities = days.flatMap(day => day.activities).sort((a,b) => Date.parse(a.start)-Date.parse(b.start));
  return {current: activities.find(a => Date.parse(a.start)<=+now && +now<Date.parse(a.end)), next: activities.find(a=>Date.parse(a.start)>+now)};
}
export function japanDate(now: Date) { return new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).format(now); }
export function daysUntil(date: string, now: Date) { return Math.ceil((Date.parse(date)-Date.parse(japanDate(now)))/86400000); }
export function dateLabel(date: string) { return new Intl.DateTimeFormat('es-ES',{day:'numeric',month:'short',timeZone:'UTC'}).format(new Date(date.slice(0,10)+'T12:00:00Z')); }
export function timeLabel(date: string) { return new Intl.DateTimeFormat('es-ES',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Tokyo'}).format(new Date(date)); }
export function activityRange(activity: Activity) { return `${timeLabel(activity.start)} – ${timeLabel(activity.end)}`; }
export function mapUrl(location: string) { return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`; }

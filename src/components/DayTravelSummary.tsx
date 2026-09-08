import { useTrip } from '../context';
import { dateLabel, pendingLabel } from '../lib/time';
import { MapsLink } from './ui';

export function DayTravelSummary({date,now}:{date?:string;now?:Date}) {
 const {hotels,transport}=useTrip();
 const localDate=(zone:string)=>date??new Intl.DateTimeFormat('sv-SE',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
 const stays=hotels.filter(h=>{const day=localDate(h.city==='Madrid'?'Europe/Madrid':'Asia/Tokyo');return h.checkIn&&h.checkOut&&h.checkIn<=day&&day<=h.checkOut;});
 const flights=transport.filter(t=>t.type==='Vuelo'&&(t.date===localDate(t.departureTimeZone??'Asia/Tokyo')||t.arrivalDate===localDate(t.arrivalTimeZone??'Asia/Tokyo')));
 if(!stays.length&&!flights.length)return null;
 return <section className="panel day-travel-summary" aria-label="Alojamientos y vuelos del día"><p className="eyebrow">ALOJAMIENTOS Y VUELOS DEL DÍA</p>{stays.map(h=><div key={h.id}><h3>{h.checkOut===localDate(h.city==='Madrid'?'Europe/Madrid':'Asia/Tokyo')?'Salida de alojamiento':'Alojamiento'} · {h.name}</h3><p>{dateLabel(h.checkIn)} → {dateLabel(h.checkOut)} · {pendingLabel(h.status)}</p><p className="muted">{h.city} · {pendingLabel(h.area)}. Hora de entrada / salida: Pendiente de confirmar</p>{h.location&&<MapsLink location={h.location}/>}</div>)}{flights.map(t=><div key={t.id}><h3>{t.title} · {pendingLabel(t.status)}</h3><p>Salida: {dateLabel(t.date)} · {pendingLabel(t.time)} ({t.from})</p><p>Llegada: {t.arrivalDate?dateLabel(t.arrivalDate)+' · ':''}{pendingLabel(t.arrivalTime)} ({t.to})</p></div>)}</section>;
}

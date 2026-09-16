import { LuggageDetails } from '../components/LuggageDetails';
import { transitionOnly, exclusiveAlternative } from '../lib/itinerary-presentation';
import { DayPlanning } from '../components/DayPlanning';
import { FoodToday } from '../components/FoodToday';
import urbanTransfers from '../../data/urban-transfers.json';
import { Fragment, useState } from 'react';
import { MapPin } from 'lucide-react';
import { useTrip } from '../context';
import { Link } from 'react-router-dom';
import { PlacePreview } from '../components/PlacePreview';
import { PageHeading, MapsLink, Empty } from '../components/ui';
import { activityRange, dateLabel, timeLabel } from '../lib/time';
function urbanConnections(day:import('../types').Day,places:import('../types').Place[]){
 const result=new Map<string,{from:string;to:string;route?:typeof urbanTransfers[number];transition?:import('../types').Activity;optional:boolean}>();
 let previous:import('../types').Activity|undefined,transition:import('../types').Activity|undefined;
 for(const a of day.activities){
  if(transitionOnly(a)){transition=a;continue;}
  if(a.movement||a.transportId){previous=undefined;transition=undefined;continue;}
  const destination=places.find(p=>p.id===a.placeId);
  if(!destination&&!a.location)continue;
  if(previous){const origin=places.find(p=>p.id===previous!.placeId);
   const from=origin?.name??previous.location,to=destination?.name??a.location;
   if(!exclusiveAlternative(a,previous)&&from!==to&&(!origin||!destination||origin.city===destination.city))result.set(a.id,{from,to,route:urbanTransfers.find(r=>r.from===previous!.placeId&&r.to===a.placeId),transition,optional:Boolean(previous.optional||a.optional)});
  }
  previous=a;transition=undefined;
 }
 return result;
}
function activityNote(a:import('../types').Activity){
 const prefix=a.note.match(/^🕐 Orientativo: ([^.]+)\.\s*/);
 const normalize=(value:string)=>value.replace(/[–→-]/g,'-').replace(/\s/g,'');
 const planned=a.planningNote?.split(' · ')[0];
 const note=prefix&&planned&&normalize(prefix[1])===normalize(planned)?a.note.slice(prefix[0].length):a.note;
 return (a.transportId?note.replace('🟠 Pendiente de comprar / confirmar. ', ''):note).replace(a.movement?.estimatedDuration?/Duración estimada: [^.]+\.\s*/:/^$/, '');
}
function actionIcon(a:import('../types').Activity){
 if(a.movement)return ({Tren:'🚆',Autobús:'🚌',Bus:'🚌',Shinkansen:'🚄',Taxi:'🚕','A pie':'🚶'}[a.movement.mode??'']??'↳');
 if(/enviar.*maleta/i.test(a.title))return '📦';
 if(/equipaje|maleta/i.test(a.title))return '🧳';
 if(/check-in|check-out|alojamiento/i.test(a.title))return '🏨';
 if(/onsen/i.test(a.title))return '♨️';
 if(/desayuno|comida|cena|kaiseki|bento/i.test(a.title))return '🍜';
 if(a.category==='Vuelo')return '✈️';
 return '📍';
}
function minutesLabel(value:number){const hours=Math.floor(value/60),minutes=value%60;return hours?`${hours} h${minutes?` ${minutes} min`:''}`:`${minutes} min`;}
function ActivityClock({activity:a,zone}:{activity:import('../types').Activity;zone?:string}){
 const real=Boolean(a.start||a.end);
 const suggestion=!real?a.planningNote?.match(/^(~?\d{1,2}:\d{2}(?:[–→-]\d{1,2}:\d{2})?)/)?.[0]:undefined;
 return <div className="timeline-time"><strong>{real?timeLabel(a.start??a.end,a.departureTimeZone??zone):suggestion?suggestion.split(/[–→-]/).map((time,i)=><span key={i}>{i>0?'→ ':''}{time}</span>):'—'}</strong><span>{real?'🔒 Confirmada':suggestion?(a.title.startsWith('Llegada objetivo')?'🎯 OBJETIVO DE LLEGADA · 🕐 Orientativa':'🕐 Orientativa'):'Sin hora confirmada'}</span>{real&&<small>{activityRange(a,zone)}</small>}{!real&&a.planningNote&&<small>{suggestion?a.planningNote.slice(suggestion.length).replace(/^ · Orientativo, no confirmado\.?/, '').trim():a.planningNote==='Hora pendiente de confirmar.'?'':a.planningNote}</small>}</div>;
}
export default function Itinerary(){const {itinerary:days,places,setItinerary}=useTrip();const [selected,setSelected]=useState(days[0]?.id);const day=days.find(d=>d.id===selected)??days[0];const connections=day?urbanConnections(day,places):new Map<string,never>();const luggageAction=day?.activities.find(a=>/enviar.*maleta/i.test(a.title))??day?.activities.find(a=>/check-out|equipaje|maleta/i.test(a.title))??day?.activities[0];return <><PageHeading eyebrow="EL CAMINO, DÍA A DÍA" title="Pequeños planes. Grandes recuerdos." description="Una ruta abierta a todo lo que encontremos por el camino."/>{!days.length&&<Empty>El itinerario está por preparar. Importa vuestros datos desde Ajustes.</Empty>}<div className="day-tabs" aria-label="Días del itinerario">{days.map((d,i)=><button key={d.id} className={selected===d.id?'selected':''} aria-pressed={selected===d.id} onClick={()=>setSelected(d.id)}><span>DÍA {i+1} DEL VIAJE</span><strong>{dateLabel(d.date)}</strong><span>{d.city}</span></button>)}</div>{day&&<><div className="section-heading"><div><p className="eyebrow"><MapPin size={14}/> {day.city}</p><h2>{day.title}</h2><p className="muted">{day.subtitle}</p></div><span className="date-pill">{day.timeZone==='Europe/Madrid'?'Hora local · Madrid':'Hora de Japón · JST'}</span></div><section className="panel"><p>{day.summary||day.subtitle}</p>{day.featuredPlaceId&&places.find(p=>p.id===day.featuredPlaceId)&&<PlacePreview place={places.find(p=>p.id===day.featuredPlaceId)!}/>}</section><div className="timeline daily-itinerary">{day.activities.filter(a=>!transitionOnly(a)).map(a=><Fragment key={a.id}>{exclusiveAlternative(a,day.activities[day.activities.findIndex(item=>item.id===a.id)-1])&&<p className="badge optional-badge">O · ALTERNATIVA a la visita anterior</p>}{connections.has(a.id)&&(()=>{const c=connections.get(a.id)!,r=c.route;return <div className="timeline-item urban-transfer"><div>{c.transition&&<ActivityClock activity={c.transition} zone={day.timeZone}/>}</div><div className="movement-connector urban-connector"><p><strong>{r?.mode==='A pie'?'🚶':r?.mode==='Metro + paseo'?'🚇':r?.mode==='Tren + paseo'?'🚆':'↳'} {r?.mode??'Cómo ir: pendiente de confirmar'}</strong>{r?.estimatedDuration&&` · ~${r.estimatedDuration.minMinutes}–${r.estimatedDuration.maxMinutes} min`}</p><p>{c.from} → {c.to}</p>{!r?.estimatedDuration&&<small>Duración pendiente de confirmar</small>}{c.optional&&<p>⭐ Si se realiza la visita opcional</p>}{r?.note&&<details><summary>Detalle del recorrido</summary><p>{r.note}</p></details>}{r&&<details><summary>Fuentes del recorrido</summary>{r.sources.map(source=><p key={source}><a href={source} target="_blank" rel="noreferrer">Consultar fuente</a></p>)}</details>}</div></div>;})()}<article className={`timeline-item ${a.optional?'optional-activity':''} ${a.movement?'transfer-activity':''}`} key={a.id}><ActivityClock activity={a} zone={day.timeZone}/><div className={a.movement?"movement-connector":"panel"}><p className="eyebrow">{a.movement?'DESPLAZAMIENTO':a.category}</p>{(a.optional||a.movement?.optional)&&<span className="badge optional-badge">⭐ OPCIONAL</span>}<h3>{actionIcon(a)} {a.title}</h3>{a.movement&&<div className="activity-detail">{a.movement.mode&&<p><strong>{a.movement.mode}</strong></p>}{a.movement.estimatedDuration&&<p>⏱️ Aprox. {minutesLabel(a.movement.estimatedDuration.minMinutes)}{a.movement.estimatedDuration.maxMinutes!==a.movement.estimatedDuration.minMinutes&&` – ${minutesLabel(a.movement.estimatedDuration.maxMinutes)}`}</p>}{a.movement.bookingPending&&<span className="badge pending-badge">🟠 PENDIENTE DE RESERVAR</span>}{a.movement.recommended&&<span className="badge">{a.movement.mode} recomendado · valorar según el día</span>}{a.movement.condition&&<p>{a.movement.condition}</p>}{a.movement.alternatives?.map((option,i)=><div className="movement-alternative" key={i}><p><strong>Alternativa{option.recommended?' · Recomendado':''}</strong></p><p>{actionIcon({...a,movement:option})} {option.mode}{option.from&&option.to&&` · ${option.from} → ${option.to}`}{option.estimatedDuration&&` · ~${minutesLabel(option.estimatedDuration.minMinutes)}${option.estimatedDuration.maxMinutes!==option.estimatedDuration.minMinutes?` – ${minutesLabel(option.estimatedDuration.maxMinutes)}`:''}`}</p>{option.condition&&<p>{option.condition}</p>}{option.optional&&<span className="badge">⭐ OPCIONAL</span>}{option.bookingPending&&<span className="badge">🟠 PENDIENTE DE RESERVAR</span>}</div>)}</div>}{day.luggage&&a.id===luggageAction?.id&&<div className="activity-detail inline-luggage"><strong>🧳 EQUIPAJE{ /enviar.*maleta/i.test(a.title)?' · 📦 ENVÍO PENDIENTE':''}</strong><LuggageDetails day={day}/></div>}{a.note&&<div className={`activity-detail ${a.movement?'transfer-detail':''}`}>{a.note.includes('solo con buen tiempo;')?<><p><strong>☀️ SI HACE BUEN TIEMPO</strong><br/>{a.note.split(';')[0]}</p><p><strong>🌧️ SI HACE MAL TIEMPO</strong><br/>{a.note.split(';').slice(1).join(';')}</p></>:<p>{activityNote(a)}</p>}</div>}{day.date==='2026-11-25'&&a.planningNote?.startsWith('10:15')&&<p className="small muted">🕐 Secuencia orientativa: llegada → mirador → pueblo. Las 10:15 no garantizan la llegada al pueblo: falta confirmar el tiempo de visita y bajada del mirador.</p>}{a.placeId&&places.find(p=>p.id===a.placeId)&&<details className="activity-photo"><summary>Ver fotografía del lugar</summary><PlacePreview place={places.find(p=>p.id===a.placeId)!}/></details>}<button className="button" aria-pressed={Boolean(a.completed)} onClick={()=>setItinerary(days.map(d=>d.id===day.id?{...d,activities:d.activities.map(item=>item.id===a.id?{...item,completed:!item.completed}:item)}:d))}>{a.completed?'Completado · desmarcar':'Marcar plan completado'}</button>{a.placeId&&<Link className="button" to={`/lugares/${encodeURIComponent(a.placeId)}`}>Ver ficha del lugar</Link>}{a.location&&<MapsLink location={a.location}/>}</div></article></Fragment>)}</div><DayPlanning key={day.id} day={day} places={places} onChange={updated=>setItinerary(days.map(d=>d.id===updated.id?updated:d))}/><FoodToday day={day}/></>}</>;}

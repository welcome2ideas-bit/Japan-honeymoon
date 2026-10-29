import { expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import Itinerary from './Itinerary';
import { parseTrip } from '../lib/import';
import { connectItinerary } from '../lib/confirmed-travel';
import settings from '../../data/trip.json';
import itinerary from '../../data/itinerary.json';
import places from '../../data/places.json';
import hotels from '../../data/hotels.json';
import transport from '../../data/transport.json';
import tasks from '../../data/checklist.json';
const selection=vi.hoisted(()=>({date:'2026-11-25'}));
vi.mock('../context',()=>({useTrip:()=>{
 const data=parseTrip(structuredClone({version:2,settings,itinerary,places,hotels,transport,tasks}));
 return {...data,itinerary:connectItinerary(data).filter(d=>d.date===selection.date),setItinerary:vi.fn()};
}}));
const render=(date:string)=>{selection.date=date;return renderToStaticMarkup(createElement(MemoryRouter,{children:createElement(Itinerary)}));};
it('shows the existing bus times as suggestions and keeps the published non-reserved services unconfirmed',()=>{
 const html=render('2026-11-25');for(const time of ['08:50','09:40','15:15','16:05'])expect(html).toContain(time);
 expect(html).toContain('🕐 Orientativa');expect(html).toContain('sin reserva obligatoria');expect(html).not.toContain('🟠 PENDIENTE DE RESERVAR');
 expect(html).not.toContain('🔒 Confirmada');expect(html).toContain('DESPLAZAMIENTO');
});
it('shows the luggage recommendation and weather-dependent optional circuit',()=>{
 const luggage=render('2026-11-26');expect(luggage).toContain('EQUIPAJE');expect(luggage).toContain('Recomendado / pendiente de confirmar');expect(luggage).toContain('Hakone: solo mochilas con equipaje de una noche');
 const hakone=render('2026-11-27');expect(hakone).toContain('SI HACE BUEN TIEMPO');expect(hakone).toContain('SI HACE MAL TIEMPO');expect(hakone).toContain('⭐ OPCIONAL');expect(hakone).toContain('Sin hora confirmada');
});
it('keeps confirmed flight clocks and existing taxi advice distinct from suggestions',()=>{
 expect(render('2026-11-19')).toContain('🔒 Confirmada');expect(render('2026-11-22')).toContain('Taxi recomendado');
});
it('renders luggage and movement inside the chronological plan, without separate travel blocks',()=>{
 const html=render('2026-11-26');
 expect(html).not.toContain('ALOJAMIENTOS Y TRANSPORTES DEL DÍA');
 expect(html).not.toContain('panel day-luggage');
 expect(html).toContain('HIDA 6');expect(html).toContain('09:36');
 expect(html).toContain('KODAMA 822');expect(html).toContain('14:42');
 const timeline=html.slice(html.indexOf('timeline daily-itinerary'));
 expect(timeline.indexOf('📦 Confirmar envío de cuatro maletas')).toBeLessThan(timeline.indexOf('🚆 TAKAYAMA'));
 expect(timeline.indexOf('🧳 EQUIPAJE')).toBeLessThan(timeline.indexOf('🚆 TAKAYAMA'));
 expect(html.indexOf('timeline daily-itinerary')).toBeLessThan(html.indexOf('ESTADO DEL DÍA'));
});
it('renders walking and rail estimates from structured data in their own actions',()=>{
 expect(render('2026-11-30')).toContain('🚶 Caminar hacia Ginza');
 expect(render('2026-11-30')).toContain('⏱️ Aprox. 10 min');
 expect(render('2026-11-29')).toContain('🚆 Tren hacia Akihabara');
 expect(render('2026-11-29')).toContain('⏱️ Aprox. 15 min');
});
it('renders structured movements as light connectors between unchanged activity cards',()=>{
 const html=render('2026-11-25');
 expect(html.match(/class="movement-connector"/g)).toHaveLength(2);
 expect(html).toContain('🚌 Takayama');
 expect(html).toContain('sin reserva obligatoria');
 const timeline=html.slice(html.indexOf('timeline daily-itinerary'));
 expect(timeline.indexOf('Centro de autobuses Nohi')).toBeLessThan(timeline.indexOf('class="movement-connector"'));
 expect(timeline.indexOf('class="movement-connector"')).toBeLessThan(timeline.indexOf('📍 Mirador Shiroyama'));
});
it('shows only existing alternatives and does not add connectors between unstructured visits',()=>{
 const html=render('2026-11-23');
 expect(html).toContain('Alternativa · Recomendado');
 expect(html).toContain('Si evita varios transbordos.');
 expect(html.match(/class="movement-connector"/g)).toHaveLength(4);
 expect(html.match(/class="movement-alternative"/g)).toHaveLength(1);
});
it('adds urban connections and presents an empty exit activity as its departure time',()=>{
 const html=render('2026-11-20'),timeline=html.slice(html.indexOf('timeline daily-itinerary'));
 expect(timeline).toContain('Castillo de Osaka → Mercado Kuromon Ichiba');
 expect(timeline).toContain('Metro + paseo');expect(timeline).toContain('11:30');
 expect(timeline).not.toContain('📍 Salida del castillo');
 expect(timeline).toContain('12:15');expect(timeline).toContain('Duración pendiente de confirmar');
});
it('keeps urban estimates qualified and retains optional route conditions',()=>{
 expect(render('2026-11-22')).toContain('~5–10 min');
 expect(render('2026-11-19')).toContain('⭐ Si se realiza la visita opcional');
 expect(render('2026-11-28')).toContain('Harajuku → Omotesando');
 expect(render('2026-11-30')).toContain('Ginza → Shinjuku');
});

it('distinguishes alternatives, luggage and uncertain arrival without rewriting data',()=>{
 const sky=render('2026-11-28');expect(sky).toContain('O · ALTERNATIVA');
 expect(sky).not.toMatch(/Shibuya Sky → Tokyo Metropolitan/);
 const hakone=render('2026-11-27');expect(hakone).toContain('si la entrega está confirmada');expect(hakone).not.toContain('Enviar maleta grande Takayama');
 expect(render('2026-12-01')).toContain('Las maletas quedan en el hotel');
 expect(render('2026-11-26')).toContain('OBJETIVO DE LLEGADA');
 expect(render('2026-11-25')).toContain('no fijar llegada garantizada a las 10:15');
});

it('renders the paid Nara booking and all four Japanese-time reminders without duplicate deposits',()=>{
 const html=render('2026-11-21');
 for(const text of ['CONFIRMADO Y PAGADO','7-Eleven Nara Kencho','セブン-イレブン奈良県庁店','4.200 JPY','Bag Size × 2','Suitcase Size × 4','08:00','09:00','14:00','14:30','15:00','15:20'])expect(html).toContain(text);
 expect(html.match(/<h3>[^<]*DEJAR EQUIPAJE<\/h3>/g)).toHaveLength(1);
 for(const title of ['CONSIGNA RESERVADA EN NARA','REGRESAR HACIA LA CONSIGNA','RECOGER EQUIPAJE'])expect(html.match(new RegExp('<h3>[^<]*'+title+'<\\/h3>','g'))).toHaveLength(1);
 expect(html).not.toContain('Consignas sin reserva');expect(html).not.toContain('No hay reserva ni disponibilidad garantizada');
 for(const visit of ['Nara Park','Tōdai-ji','Kasuga Taisha','Gion','Comida','Cena'])expect(html).toContain(visit);
 const day=itinerary.find(d=>d.date==='2026-11-21')!;
 expect(day.timeZone).toBe('Asia/Tokyo');
 expect(day.activities.find(a=>a.id==='2026-11-21-store-luggage')?.start).toBe('2026-11-21T09:00:00+09:00');
 expect(day.activities.find(a=>a.id==='2026-11-21-retrieve-luggage')?.start).toBe('2026-11-21T15:00:00+09:00');
 const departure=day.activities.find(a=>a.id==='2026-11-21-v24-7')!;
 expect(departure.start).toBeNull();expect(departure.planningNote).toContain('15:20');
 expect(new Set(day.activities.map(a=>a.id)).size).toBe(day.activities.length);
});

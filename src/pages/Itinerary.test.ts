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
it('shows the existing bus times as suggestions and marks both journeys pending',()=>{
 const html=render('2026-11-25');for(const time of ['08:50','09:35','15:15','16:15'])expect(html).toContain(time);
 expect(html).toContain('🕐 Orientativa');expect(html.match(/🟠 PENDIENTE/g)).toHaveLength(2);
 expect(html).not.toContain('🔒 Confirmada');expect(html).toContain('DESPLAZAMIENTO');
});
it('shows the luggage recommendation and weather-dependent optional circuit',()=>{
 const luggage=render('2026-11-26');expect(luggage).toContain('EQUIPAJE');expect(luggage).toContain('Recomendado / pendiente de confirmar');expect(luggage).toContain('Hakone: mochila / equipaje de una noche');
 const hakone=render('2026-11-27');expect(hakone).toContain('SI HACE BUEN TIEMPO');expect(hakone).toContain('SI HACE MAL TIEMPO');expect(hakone).toContain('⭐ OPCIONAL');expect(hakone).toContain('Sin hora confirmada');
});
it('keeps confirmed flight clocks and existing taxi advice distinct from suggestions',()=>{
 expect(render('2026-11-19')).toContain('🔒 Confirmada');expect(render('2026-11-22')).toContain('Taxi recomendado');
});
it('renders luggage and movement inside the chronological plan, without separate travel blocks',()=>{
 const html=render('2026-11-26');
 expect(html).not.toContain('ALOJAMIENTOS Y TRANSPORTES DEL DÍA');
 expect(html).not.toContain('panel day-luggage');
 expect(html).toContain('⏱️ Aprox. 5 h 15 min');
 expect(html).toContain('5 h 45 min');
 const timeline=html.slice(html.indexOf('timeline daily-itinerary'));
 expect(timeline.indexOf('📦 Enviar maleta')).toBeLessThan(timeline.indexOf('🚆 Takayama'));
 expect(timeline.indexOf('🧳 EQUIPAJE')).toBeLessThan(timeline.indexOf('🚆 Takayama'));
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
 expect(html).toContain('🟠 PENDIENTE DE RESERVAR');
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
 expect(render('2026-12-01')).toContain('La maleta grande queda en el hotel');
 expect(render('2026-11-26')).toContain('OBJETIVO DE LLEGADA');
 expect(render('2026-11-25')).toContain('Las 10:15 no garantizan');
});

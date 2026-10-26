import type { Day } from '../types';
export function LuggageDetails({day}:{day:Day}){
 if(!day.luggage)return null;
 if(day.date==='2026-11-26')return <><p>📦 Confirmar envío de cuatro maletas: Mercure Hida Takayama → THE KNOT TOKYO.</p><p>Recomendado / pendiente de confirmar. Esperando respuesta de ambos hoteles sobre gestión, recepción, coste, pago y fechas. Servicio no contratado; entrega aún sin programar.</p><p>🎒 Hakone: solo mochilas con equipaje de una noche, si se confirma el envío. Si no, resolver las cuatro maletas antes de salir.</p></>;
 if(day.date==='2026-11-27')return <><p>🎒 Hakone: mochilas, si se ha confirmado y realizado el envío.</p><p>🧳 Recuperar las cuatro maletas en THE KNOT si la entrega está confirmada.</p></>;
 if(day.date>='2026-11-28'&&day.date<='2026-12-01')return <><p>🧳 En el hotel: las cuatro maletas, una vez recibidas en THE KNOT.</p><p>🎒 Para la salida: mochilas. Las maletas quedan en el hotel.</p></>;
 if(['2026-11-20','2026-11-22','2026-11-23','2026-11-25'].includes(day.date))return <><p>🧳 Disponible en el alojamiento: dos maletas grandes y dos de cabina.</p><p>🎒 Para la salida: mochilas; dejar las cuatro maletas en el alojamiento.</p>{day.date==='2026-11-25'&&<p>📦 Confirmar con Mercure y THE KNOT la gestión, recepción, coste, pago y fechas del envío; todavía no contratado.</p>}</>;
 return <p>{day.luggage}</p>;
}

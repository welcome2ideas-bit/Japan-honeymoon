import type { Day } from '../types';
export function LuggageDetails({day}:{day:Day}){
 if(!day.luggage)return null;
 if(day.date==='2026-11-26')return <p>{day.luggage}</p>;
 if(day.date==='2026-11-27')return <><p>🎒 Hakone: mochilas, si se ha confirmado y realizado el envío.</p><p>🧳 Recuperar las cuatro maletas en THE KNOT si la entrega está confirmada.</p></>;
 if(day.date>='2026-11-28'&&day.date<='2026-12-01')return <><p>🧳 En el hotel: las cuatro maletas, una vez recibidas en THE KNOT.</p><p>🎒 Para la salida: mochilas. Las maletas quedan en el hotel.</p></>;
 if(day.date==='2026-11-25')return <p>{day.luggage}</p>;
 if(['2026-11-20','2026-11-22','2026-11-23'].includes(day.date))return <><p>🧳 Disponible en el alojamiento: dos maletas grandes y dos de cabina.</p><p>🎒 Para la salida: mochilas; dejar las cuatro maletas en el alojamiento.</p></>;
 return <p>{day.luggage}</p>;
}

import type { Day } from '../types';
export function LuggageDetails({day}:{day:Day}){
 if(!day.luggage)return null;
 if(day.date==='2026-11-26')return <><p>📦 Enviar maleta grande Takayama → THE KNOT TOKYO</p><p>Recomendado / pendiente de confirmar. Servicio, plazo y recepción con ambos hoteles; entrega no garantizada.</p><p>🎒 Hakone: mochila / equipaje de una noche.</p></>;
 if(day.date==='2026-11-27')return <><p>🎒 Hakone: mochila.</p><p>🧳 Recuperar maleta en THE KNOT si la entrega está confirmada.</p></>;
 if(day.date>='2026-11-28'&&day.date<='2026-12-01')return <><p>🧳 En el hotel: maleta grande, una vez recibida en THE KNOT.</p><p>🎒 Para la salida: mochila. La maleta grande queda en el hotel.</p></>;
 if(['2026-11-20','2026-11-22','2026-11-23','2026-11-25'].includes(day.date))return <><p>🧳 Disponible en el alojamiento: maleta grande y mochila.</p><p>🎒 Para la salida: mochila; dejar la maleta grande en el alojamiento.</p>{day.date==='2026-11-25'&&<p>📦 Confirmar con Mercure el envío a THE KNOT y la recepción en destino.</p>}</>;
 return <p>{day.luggage}</p>;
}

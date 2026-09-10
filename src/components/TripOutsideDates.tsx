import { Link } from 'react-router-dom';
import type { TripSettings } from '../types';
import { PageHeading } from './ui';
import { dateLabel } from '../lib/time';
export function TripOutsideDates({phase,remaining,settings,now}:{phase:'before'|'after'|'unknown';remaining:number|null;settings:TripSettings;now:Date}){
 const before=phase==='before',after=phase==='after';
 return <><PageHeading eyebrow="AQUÍ Y AHORA" title={before?'Japón está cada vez más cerca.':after?'Viaje completado.':'Fechas pendientes de confirmar.'} description={before?'Preparando vuestra próxima aventura.':after?'El calendario del viaje ha terminado. Vuestros recuerdos y planes siguen aquí.':'Añade las fechas reales para activar el seguimiento del viaje.'}/><section className="panel"><p className="eyebrow">{settings.name}</p><h2>{before?`${remaining} ${remaining===1?'día':'días'} para el viaje`:after?'Gracias por este viaje.':'Pendiente de confirmar'}</h2><p>{dateLabel(settings.startDate)} → {dateLabel(settings.endDate)}</p><p className="muted">Hoy en Japón: {new Intl.DateTimeFormat('es-ES',{timeZone:'Asia/Tokyo',dateStyle:'full',timeStyle:'short'}).format(now)}</p>{after&&<p className="small muted">Los lugares y actividades conservan su estado; el fin del viaje no los marca como visitados automáticamente.</p>}<div className="filter-row"><Link className="button" to="/itinerario">Ver itinerario</Link><Link className="button" to={before?'/pendientes':after?'/lugares':'/ajustes'}>{before?'Preparar pendientes':after?'Ver lugares y recuerdos':'Configurar fechas'}</Link></div></section></>;
}

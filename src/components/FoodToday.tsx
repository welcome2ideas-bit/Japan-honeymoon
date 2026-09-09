import food from '../../data/food.json';
import type { Day } from '../types';
import { PlaceGallery } from './ui';
export function FoodToday({day}:{day?:Day}) {
 const destinations=food.filter(f=>day?.cities?.includes(f.city)||day?.city===f.city);
 if(!destinations.length)return null;
 return <section className="panel food-today"><p className="eyebrow">SABORES DEL DESTINO</p><h2>Qué comer hoy</h2><p className="small muted">Ideas para elegir sobre la marcha; sin restaurantes ni reservas asignados.</p><div className="two-columns">{destinations.map(f=><article className="panel wish-card" key={f.city}><PlaceGallery images={f.gallery}/><div className="wish-body"><p className="small muted">{f.imageCaption}</p><h3>{f.city}</h3><p className="eyebrow">NO TE VAYAS SIN PROBAR…</p><h3>{f.highlight}</h3><p>{f.description}</p><h3>Especialidades</h3><ul>{f.dishes.map(d=><li key={d}>{d}</li>)}</ul><p className="small muted">{f.note}</p></div></article>)}</div></section>;
}

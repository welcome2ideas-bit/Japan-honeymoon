import { useTrip } from '../context';
import { Photo } from './ui';
import { mapUrl, durationLabel } from '../lib/time';
export function WishlistStops({ids=[],date}:{ids?:string[];date?:string}){
 const {wishlist}=useTrip();if(!ids.length)return null;
 return <section><p className="eyebrow">DE VUESTRA WISHLIST · PROPUESTA FLEXIBLE</p>{ids.map(id=>{const p=wishlist.find(p=>p.id===id);return p?<div key={id}>{p.imageUrl&&<div className="itinerary-photo"><Photo photo={{src:p.imageUrl,alt:p.name}}/></div>}<h3>{p.name}</h3><p>{p.note}</p><p className="small">Duración: {durationLabel(p.durationMinutes)} · {p.openingHours?.some(h=>h.date===date)?'Encaja en la apertura facilitada; comprobar antes de ir.':'Apertura: Pendiente de confirmar'}</p><a className="map-link" href={p.mapsUrl||mapUrl(`${p.latitude},${p.longitude}`)} target="_blank" rel="noreferrer">Abrir en Google Maps ↗</a></div>:<p key={id}>Lugar de Wishlist: Pendiente de confirmar</p>;})}</section>;
}

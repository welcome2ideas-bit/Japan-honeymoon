import { ArrowUpRight, MapPin, Images, ChevronLeft, ChevronRight, Clock, Flag, Lightbulb, Utensils } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Place, PlaceImage } from '../types';
import { mapUrl } from '../lib/time';
export function PageHeading({eyebrow,title,description,action}:{eyebrow:string;title:string;description:string;action?:ReactNode}){return <div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="muted">{description}</p></div>{action}</div>;}
export function MapsLink({location}:{location:string}){return <a className="map-link" href={mapUrl(location)} target="_blank" rel="noreferrer"><MapPin size={16}/> Abrir en Google Maps <ArrowUpRight size={15}/></a>;}
export function Empty({children}:{children:ReactNode}){return <div className="empty"><MapPin size={28}/><p>{children}</p></div>;}

export function Photo({photo,className='',priority=false}:{photo:PlaceImage;className?:string;priority?:boolean}) {
 const [failed,setFailed]=useState(false);useEffect(()=>setFailed(false),[photo.src]);
 if(failed)return <div className={`photo-fallback ${className}`} role="img" aria-label={photo.alt}><Images size={24}/><span>Fotografía no disponible</span></div>;
 return <img className={`photo ${className}`} src={photo.src} alt={photo.alt} loading={priority?'eager':'lazy'} fetchPriority={priority?'high':'auto'} decoding="async" onError={()=>setFailed(true)}/>;
}

export function PlaceGallery({images=[]}:{images?:PlaceImage[]}) {
 const [index,setIndex]=useState(0);
 const valid=images.filter(image=>image&&typeof image.src==='string'&&typeof image.alt==='string'&&/^(https:\/\/|\.\/|\/)/.test(image.src));
 const selected=valid[index%Math.max(valid.length,1)];
 if(!selected)return <div className="gallery-placeholder"><Images size={25} strokeWidth={1.3}/><span>Aquí empieza un recuerdo.</span><small>Fotografías pendientes</small></div>;
 return <div className="place-gallery"><Photo key={selected.src} photo={selected}/>{valid.length>1&&<div className="gallery-controls"><button className="icon-button" aria-label="Imagen anterior" onClick={()=>setIndex((index-1+valid.length)%valid.length)}><ChevronLeft size={18}/></button><span aria-live="polite">{index%valid.length+1} / {valid.length}</span><button className="icon-button" aria-label="Imagen siguiente" onClick={()=>setIndex((index+1)%valid.length)}><ChevronRight size={18}/></button></div>}{selected.credit&&<span className="gallery-credit">{selected.credit}</span>}</div>;
}

export function PlaceDetails({place,expanded=false}:{place:Place;expanded?:boolean}) {
 const tips=Array.isArray(place.tips)?place.tips.filter(t=>typeof t==='string'):[];
 const food=Array.isArray(place.typicalFood)?place.typicalFood.filter(t=>typeof t==='string'):[];
 return <details className="place-details" open={expanded||undefined}><summary>La experiencia <span>Ver detalles</span></summary><div className="detail-content"><div className="detail-meta"><span><Clock size={16}/>{typeof place.durationMinutes==='number'&&place.durationMinutes>0?`${place.durationMinutes} min`:'Duración por definir'}</span><span><Flag size={16}/>{place.priority||'Prioridad por definir'}</span></div><h3>Sobre este lugar</h3><p className="muted">{place.description||'La descripción llegará cuando preparemos este lugar.'}</p><h3><Lightbulb size={16}/> Consejos</h3>{tips.length?<ul>{tips.map((tip,i)=><li key={i}>{tip}</li>)}</ul>:<p className="muted">Todavía no hay consejos guardados.</p>}<h3><Utensils size={16}/> Comida típica</h3>{food.length?<ul>{food.map((item,i)=><li key={i}>{item}</li>)}</ul>:<p className="muted">Pendiente de descubrir.</p>}</div></details>;
}

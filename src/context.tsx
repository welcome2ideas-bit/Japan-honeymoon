import { integrateWishlist } from './lib/wishlist-planning';
import { mergeWishlist } from './lib/wishlist';
import { updateCatalog } from './lib/catalog-update';
import { createContext, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import checklist from '../data/checklist.json';
import wishlist from '../data/wishlist.json';
import catalog from '../data/places.json';
import trip from '../data/trip.json';
import itinerary from '../data/itinerary.json';
import hotels from '../data/hotels.json';
import transport from '../data/transport.json';
import { connectItinerary } from './lib/confirmed-travel';
import { useStoredState } from './lib/storage';
import { isTrip, parseTrip, remoteUrl } from './lib/import';
import type { TripData, Place, Task, TripSettings, WishlistEntry, Day } from './types';
export type Theme='system'|'light'|'dark';
const isTheme=(v:unknown):v is Theme=>v==='system'||v==='light'||v==='dark';
// Validate inside React initialization, never while importing the module.
function initial(){return parseTrip({version:2,settings:{name:trip.name,startDate:trip.startDate,endDate:trip.endDate},places:catalog,itinerary,hotels,transport,tasks:checklist,wishlist});}

// Keep old keys intact so the original browser data can always be recovered.
function legacy():TripData {
 const result=initial();
 try {
  const oldTasks:unknown=JSON.parse(localStorage.getItem('jh-tasks-v1')||'null');
  const samples:Record<string,string>={flights:'Reservar los vuelos',hotels:'Elegir nuestro hotel en Tokio',esim:'Preparar la eSIM',passport:'Revisar la documentación'};
  if(Array.isArray(oldTasks))result.tasks=oldTasks.filter(t=>t&&typeof t.id==='string'&&typeof t.title==='string'&&typeof t.category==='string'&&['Pendiente','Reservado','Completado'].includes(t.status)&&!(samples[t.id]===t.title&&t.status==='Pendiente'));
  const oldPlaces:unknown=JSON.parse(localStorage.getItem('jh-places-v1')||'null');
  if(Array.isArray(oldPlaces))result.places=oldPlaces.filter(p=>p&&typeof p.id==='string'&&typeof p.name==='string'&&typeof p.city==='string'&&typeof p.category==='string'&&typeof p.note==='string'&&typeof p.favorite==='boolean'&&!(p.id==='fushimi'&&p.name==='Fushimi Inari'&&p.note==='Caminar juntos entre los torii.'&&p.favorite===true)&&!(p.id==='coffee'&&p.name==='Una cafetería especial en Tokio'&&p.note==='Encontrar nuestro rincón para un café sin prisas.'&&p.favorite===false)).map(p=>({id:p.id,name:p.name,city:p.city,category:p.category,note:p.note,favorite:p.favorite,imageUrl:'',gallery:Array.isArray(p.images)?p.images.filter((i:{src?:unknown;alt?:unknown})=>remoteUrl(i.src)&&typeof i.alt==='string'):[],curiosities:[],nearbyPlaceIds:[],status:'pendiente',...(typeof p.description==='string'?{description:p.description}:{}),...(Array.isArray(p.tips)&&p.tips.every((t:unknown)=>typeof t==='string')?{tips:p.tips}:{}),...(Array.isArray(p.typicalFood)&&p.typicalFood.every((t:unknown)=>typeof t==='string')?{typicalFood:p.typicalFood}:{}),...(typeof p.mapsQuery==='string'?{mapsQuery:p.mapsQuery}:{}),...(typeof p.durationMinutes==='number'&&p.durationMinutes>0?{durationMinutes:p.durationMinutes}:{}),...(['Imprescindible','Nos gustaría','Si hay tiempo'].includes(p.priority)?{priority:p.priority}:{})}));
  const oldSettings=JSON.parse(localStorage.getItem('jh-settings-v1')||'null');
  if(oldSettings&&typeof oldSettings.name==='string')result.settings={...oldSettings,...(oldSettings.startDate==='2026-11-09'&&oldSettings.endDate==='2026-11-23'?{startDate:'',endDate:''}:{})};
  return parseTrip(result);
 }catch{return initial();}
}
type State=TripData&{importWishlist:(entries:WishlistEntry[])=>{added:number;pending:number};setItinerary:(v:Day[])=>void;wishlist:WishlistEntry[];setWishlist:(v:WishlistEntry[])=>void;tasks:Task[];setTasks:(v:Task[])=>void;places:Place[];setPlaces:(v:Place[])=>void;setSettings:(v:TripSettings)=>void;theme:Theme;setTheme:(v:Theme)=>void;importTrip:(v:unknown)=>void;exportTrip:()=>TripData};
// Keep provider and consumers on the same context during data hot updates.
const Context:ReturnType<typeof createContext<State|null>>=import.meta.hot?.data.tripContext??createContext<State|null>(null);
if(import.meta.hot)import.meta.hot.data.tripContext=Context;
export function TripProvider({children}:{children:ReactNode}) {
 const [data,setData,error]=useStoredState<TripData>('jh-trip-v2',()=>updateCatalog(legacy(),initial()),isTrip,saved=>parseTrip(updateCatalog(saved,initial())));
 const [theme,setTheme,themeError]=useStoredState<Theme>('jh-theme-v1','system',isTheme);
 useEffect(()=>{const media=window.matchMedia('(prefers-color-scheme: dark)');const apply=()=>{const dark=theme==='dark'||theme==='system'&&media.matches;document.documentElement.dataset.theme=dark?'dark':'light';document.querySelector('meta[name="theme-color"]')?.setAttribute('content',dark?'#111413':'#f6f5f1');};apply();media.addEventListener('change',apply);return()=>media.removeEventListener('change',apply);},[theme]);
 const value:State={...data,importWishlist:entries=>{const result=integrateWishlist(data,mergeWishlist(data.wishlist??[],entries));setData(result.data);return {added:result.added,pending:result.pending};},setItinerary:itinerary=>setData({...data,itinerary}),wishlist:data.wishlist??[],setWishlist:wishlist=>setData({...data,wishlist}),itinerary:connectItinerary(data),setTasks:tasks=>setData({...data,tasks,deletedTaskIds:[...new Set([...(data.deletedTaskIds??[]),...data.tasks.filter(t=>!tasks.some(next=>next.id===t.id)).map(t=>t.id)])].filter(id=>!tasks.some(t=>t.id===id))}),setPlaces:places=>setData({...data,places}),setSettings:settings=>setData({...data,settings}),theme,setTheme,importTrip:input=>setData(parseTrip(input)),exportTrip:()=>data};
 return <Context.Provider value={value}>{(error||themeError)&&<div className="storage-warning" role="alert">{error||themeError}</div>}{children}</Context.Provider>;
}
export function useTrip(){const value=useContext(Context);if(!value)throw new Error('TripProvider missing');return value;}

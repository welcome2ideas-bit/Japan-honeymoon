import type { Place, WishlistEntry } from '../types';
import { coordinates } from './wishlist';
export function distanceKm(a:{latitude:number;longitude:number},b:{latitude:number;longitude:number}){const r=Math.PI/180;const dLat=(b.latitude-a.latitude)*r,dLon=(b.longitude-a.longitude)*r;const h=Math.sin(dLat/2)**2+Math.cos(a.latitude*r)*Math.cos(b.latitude*r)*Math.sin(dLon/2)**2;return 6371*2*Math.asin(Math.sqrt(Math.min(1,Math.max(0,h))));}
export function findNearby(origin:{latitude:number;longitude:number},places:Place[],wishlist:WishlistEntry[],radius=5,favoritesOnly=false){
 if(!coordinates(origin))return [];
 const candidates=[...places.filter(p=>p.status!=='visitado').map(p=>({...p,collection:'itinerary' as const})),...wishlist.map(p=>({...p,collection:'wishlist' as const}))];
 return candidates.filter(p=>coordinates(p)&&(!favoritesOnly||p.favorite)).map(p=>({...p,distance:distanceKm(origin,{latitude:p.latitude!,longitude:p.longitude!})})).filter(p=>p.distance<=radius).sort((a,b)=>a.distance-b.distance);
}

import type { WishlistEntry, Priority } from '../types';
export const priorities:Priority[]=['Imprescindible','Nos gustaría','Si hay tiempo'];
export function coordinates(value:{latitude?:unknown;longitude?:unknown}):value is {latitude:number;longitude:number} {return typeof value.latitude==='number'&&Number.isFinite(value.latitude)&&Math.abs(value.latitude)<=90&&typeof value.longitude==='number'&&Number.isFinite(value.longitude)&&Math.abs(value.longitude)<=180;}
export function safeMapsUrl(value:string){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&((['www.google.com','google.com','maps.google.com','www.google.co.jp','www.google.es'].includes(u.hostname)&&u.pathname.startsWith('/maps'))||u.hostname==='maps.app.goo.gl'||(u.hostname==='goo.gl'&&u.pathname.startsWith('/maps')));}catch{return false;}}
const text=(v:unknown)=>typeof v==='string'?v.trim():'';
export function validateWishlist(value:unknown):WishlistEntry[]{
 if(!Array.isArray(value)||value.length>1000)throw new Error('La Wishlist debe ser una lista de hasta 1000 lugares.');
 const ids=new Set<string>();
 return value.map((v,i)=>{
  if(!v||typeof v!=='object')throw new Error(`Lugar ${i+1}: formato inválido.`);
  const name=text(v.name);if(!name)throw new Error(`Lugar ${i+1}: falta el nombre.`);
  const id=text(v.id)||`wishlist-${i}-${name}`;if(ids.has(id))throw new Error('Hay identificadores repetidos.');ids.add(id);
  if((v.latitude!=null||v.longitude!=null)&&!coordinates(v))throw new Error(`${name}: coordenadas inválidas; indica ambas o déjalas vacías.`);
  const mapsUrl=text(v.mapsUrl);if(mapsUrl&&!safeMapsUrl(mapsUrl))throw new Error(`${name}: el enlace debe ser de Google Maps y usar HTTPS.`);
  const imageUrl=text(v.imageUrl);if(imageUrl){try{const url=new URL(imageUrl);if(url.protocol!=='https:'||url.username||url.password)throw new Error();}catch{throw new Error(`${name}: imagen HTTPS o vacía.`);}}
  if(v.priority!=null&&v.priority!==''&&!priorities.includes(v.priority))throw new Error(`${name}: prioridad inválida.`);
  if(v.favorite!==undefined&&typeof v.favorite!=='boolean')throw new Error(`${name}: favorito debe ser verdadero o falso.`);
  return {id,name,city:text(v.city),category:text(v.category),note:text(v.note),favorite:v.favorite??false,imageUrl,mapsUrl,...(coordinates(v)?{latitude:v.latitude,longitude:v.longitude}:{}),...(priorities.includes(v.priority)?{priority:v.priority}:{})};
 });
}
function csvRows(input:string){const rows:string[][]=[];let row:string[]=[],cell='',quote=false;for(let i=0;i<input.length;i++){const c=input[i];if(c==='"'){if(quote&&input[i+1]==='"'){cell+='"';i++;}else quote=!quote;}else if(c===','&&!quote){row.push(cell);cell='';}else if((c==='\n'||c==='\r')&&!quote){if(c==='\r'&&input[i+1]==='\n')i++;row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell='';}else cell+=c;}if(quote)throw new Error('CSV con comillas sin cerrar.');row.push(cell);if(row.some(Boolean))rows.push(row);return rows;}
export function parseWishlistFile(content:string,isCsv=false):WishlistEntry[]{
 if(content.length>5*1024*1024)throw new Error('El archivo debe ocupar menos de 5 MB.');
 if(isCsv){const [headers,...rows]=csvRows(content.replace(/^\uFEFF/,''));if(!headers)throw new Error('El archivo está vacío.');const keys=headers.map(s=>s.trim().toLowerCase());return validateWishlist(rows.map(r=>{const get=(...names:string[])=>r[keys.findIndex(k=>names.includes(k))]??'';return {name:get('title','name','nombre'),note:get('note','notes','nota','notas'),city:get('city','ciudad'),category:get('category','categoría','categoria'),mapsUrl:get('url','google maps url','mapsurl')};}));}
 const data=JSON.parse(content.replace(/^\uFEFF/,''));
 if(data?.type==='FeatureCollection'&&Array.isArray(data.features))return validateWishlist(data.features.map((f:Record<string,any>)=>({name:f.properties?.Title??f.properties?.name,note:f.properties?.Comment??f.properties?.note,city:f.properties?.city,category:f.properties?.category,mapsUrl:f.properties?.GoogleMapsURL??f.properties?.['Google Maps URL'],...(f.geometry?.type==='Point'&&Array.isArray(f.geometry.coordinates)?{longitude:f.geometry.coordinates[0],latitude:f.geometry.coordinates[1]}:{})})));
 return validateWishlist(Array.isArray(data)?data:data?.wishlist);
}
export function mergeWishlist(existing:WishlistEntry[],incoming:WishlistEntry[]){const key=(p:WishlistEntry)=>p.mapsUrl||`${p.name.toLocaleLowerCase('es')}|${p.city.toLocaleLowerCase('es')}`;const seen=new Set(existing.map(key));return [...existing,...incoming.filter(p=>{if(seen.has(key(p)))return false;seen.add(key(p));return true;}).map(p=>({...p,id:crypto.randomUUID()}))];}

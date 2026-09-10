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
  const validDate=(x:unknown)=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString().slice(0,10)===x;
  const clock=(x:unknown)=>typeof x==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(x);
  if(v.durationMinutes!=null&&(!Number.isFinite(v.durationMinutes)||typeof v.durationMinutes!=='number'||v.durationMinutes<=0))throw new Error(`${name}: duración inválida.`);
  if(v.closedDates!==undefined&&(!Array.isArray(v.closedDates)||!v.closedDates.every(validDate)))throw new Error(`${name}: fechas de cierre inválidas.`);
  if(v.openingHours!==undefined&&(!Array.isArray(v.openingHours)||!v.openingHours.every((h:any)=>h&&validDate(h.date)&&clock(h.opens)&&clock(h.closes)&&h.closes>h.opens)))throw new Error(`${name}: franjas de apertura inválidas.`);
  return {...(v.durationMinutes!=null?{durationMinutes:v.durationMinutes}:{}),...(v.closedDates?{closedDates:v.closedDates}:{}),...(v.openingHours?{openingHours:v.openingHours.map((h:any)=>({date:h.date,opens:h.opens,closes:h.closes}))}:{}),id,name,city:text(v.city),category:text(v.category),note:text(v.note),favorite:v.favorite??false,imageUrl,mapsUrl,...(coordinates(v)?{latitude:v.latitude,longitude:v.longitude}:{}),...(priorities.includes(v.priority)?{priority:v.priority}:{})};
 });
}
function csvRows(input:string){const rows:string[][]=[];let row:string[]=[],cell='',quote=false;for(let i=0;i<input.length;i++){const c=input[i];if(c==='"'){if(quote&&input[i+1]==='"'){cell+='"';i++;}else quote=!quote;}else if(c===','&&!quote){row.push(cell);cell='';}else if((c==='\n'||c==='\r')&&!quote){if(c==='\r'&&input[i+1]==='\n')i++;row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell='';}else cell+=c;}if(quote)throw new Error('CSV con comillas sin cerrar.');row.push(cell);if(row.some(Boolean))rows.push(row);return rows;}
export function parseWishlistFile(content:string,isCsv=false):WishlistEntry[]{
 if(content.length>5*1024*1024)throw new Error('El archivo debe ocupar menos de 5 MB.');
 if(isCsv){const [headers,...rows]=csvRows(content.replace(/^\uFEFF/,''));if(!headers)throw new Error('El archivo está vacío.');const keys=headers.map(s=>s.trim().toLowerCase());return validateWishlist(rows.map(r=>{const get=(...names:string[])=>r[keys.findIndex(k=>names.includes(k))]??'';return {name:get('title','name','nombre'),note:get('note','notes','nota','notas'),city:get('city','ciudad'),category:get('category','categoría','categoria'),mapsUrl:get('url','google maps url','mapsurl'),...(get('latitude','latitud')||get('longitude','longitud')?{latitude:Number(get('latitude','latitud')||NaN),longitude:Number(get('longitude','longitud')||NaN)}:{}),...(get('durationminutes')?{durationMinutes:Number(get('durationminutes'))}:{})};}));}
 const data=JSON.parse(content.replace(/^\uFEFF/,''));
 if(data?.type==='FeatureCollection'&&Array.isArray(data.features))return validateWishlist(data.features.map((f:Record<string,any>)=>({name:f.properties?.Title??f.properties?.name,note:f.properties?.Comment??f.properties?.note,city:f.properties?.city,category:f.properties?.category,durationMinutes:f.properties?.durationMinutes,openingHours:f.properties?.openingHours,closedDates:f.properties?.closedDates,mapsUrl:f.properties?.GoogleMapsURL??f.properties?.['Google Maps URL'],...(f.geometry?.type==='Point'&&Array.isArray(f.geometry.coordinates)?{longitude:f.geometry.coordinates[0],latitude:f.geometry.coordinates[1]}:{})})));
 return validateWishlist(Array.isArray(data)?data:data?.wishlist);
}
export function mergeWishlist(existing:WishlistEntry[],incoming:WishlistEntry[]){
 const clean=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
 const result=existing.map(p=>({...p}));
 for(const p of incoming){const index=result.findIndex(old=>(p.mapsUrl&&old.mapsUrl===p.mapsUrl)||(clean(old.name)===clean(p.name)&&clean(old.city)===clean(p.city)));
  if(index<0){result.push({...p,id:crypto.randomUUID()});continue;}
  const old=result[index];result[index]={...old,...(!coordinates(old)&&coordinates(p)?{latitude:p.latitude,longitude:p.longitude}:{}),city:old.city||p.city,category:old.category||p.category,imageUrl:old.imageUrl||p.imageUrl,mapsUrl:old.mapsUrl||p.mapsUrl,durationMinutes:old.durationMinutes??p.durationMinutes,openingHours:old.openingHours??p.openingHours,closedDates:old.closedDates??p.closedDates};
 }
 return result;
}

import { useState } from 'react';
export function useStoredState<T>(key: string, initial: T | (()=>T), validate: (value: unknown) => value is T, migrate: (value:T)=>T = value=>value) {
  const [value,setValue] = useState<T>(() => { try { const raw=localStorage.getItem(key); if(raw){const parsed: unknown=JSON.parse(raw); if(validate(parsed)) return migrate(parsed);} }catch { /* Use initial data when storage is unavailable. */ } return typeof initial==='function'?(initial as ()=>T)():initial; });
  const [error,setError]=useState('');
  function update(next: T) { setValue(next); try{localStorage.setItem(key,JSON.stringify(next));setError('');}catch{setError('No se ha podido guardar en este dispositivo. MantÃ©n esta pestaÃ±a abierta para conservar los cambios.');} }
  return [value,update,error] as const;
}

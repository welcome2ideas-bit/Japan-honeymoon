import type { Activity } from '../types';
export function transitionOnly(a:Activity){return /^Salida del? /i.test(a.title)&&!a.note&&!a.location&&!a.placeId&&!a.transportId&&!a.movement&&!a.start&&!a.end&&!a.optional&&!a.reservation;}
export function exclusiveAlternative(a:Activity,previous?:Activity){return Boolean(previous?.optional&&a.optional&&(a.placeId==='metropolitan'&&previous.placeId==='sky'||/^Alternativa\b/i.test(a.note)));}

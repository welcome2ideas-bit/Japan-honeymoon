export type Status = 'Pendiente' | 'Reservado' | 'Completado';
export interface Task { id: string; title: string; category: string; status: Status }
export interface PlaceImage { src: string; alt: string; credit?: string; source?: string }
export type Priority = 'Imprescindible' | 'Nos gustaría' | 'Si hay tiempo';
export interface Place {
  id: string; name: string; city: string; category: string; note: string; favorite: boolean;
  description?: string;
  tips?: string[];
  typicalFood?: string[];
  mapsQuery?: string;
  durationMinutes?: number;
  priority?: Priority;
  imageUrl: string;
  gallery: PlaceImage[];
  curiosities: string[];
  nearbyPlaceIds: string[];
  status: 'pendiente' | 'visitado';
}
export interface Activity { id: string; title: string; start: string; end: string; location: string; category: string; note: string; placeId?: string }
export interface Day { id: string; date: string; city: string; title: string; subtitle: string; activities: Activity[] }
export interface TripSettings {name:string;startDate:string;endDate:string}
export interface Hotel {id:string;city:string;name:string;area:string;checkIn:string;checkOut:string;status:Status;location:string;note:string}
export interface Transport {id:string;type:string;title:string;from:string;to:string;date:string;time:string;status:Status;location:string;note:string}
export interface TripData {version:2;settings:TripSettings;places:Place[];itinerary:Day[];hotels:Hotel[];transport:Transport[];tasks:Task[]}

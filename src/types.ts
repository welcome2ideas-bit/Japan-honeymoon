export type Status = 'Pendiente' | 'Reservado' | 'Completado';
export interface Task { priority?:'Alta'|'Media'|'Baja'; recommendedDate?:string|null; note?:string; officialUrl?:string; priorityBasis?:string;  id: string; title: string; category: string; status: Status }
export interface PartialTravelDetails {
  trainNumber?: string | null;
  platform?: string | null;
  seat?: string | null;
  durationMinutes?: number | '' | null;
  reservation?: string | null;
}
export interface PlaceImage { src: string; alt: string; credit?: string; source?: string; license?:string; licenseUrl?:string; original?:string }
export type Priority = 'Imprescindible' | 'Nos gustaría' | 'Si hay tiempo';
export interface Place {
  id: string; name: string; city: string; category: string; note: string; favorite: boolean;
  bestTime?:string; timingBasis?:string; whyVisit?:string; latitude?:number|null; longitude?:number|null; coordinateSource?:string; sources?:string[];
  description?: string;
  tips?: string[];
  typicalFood?: string[];
  mapsQuery?: string;
  durationMinutes?: number | '' | null;
  priority?: Priority;
  imageUrl: string;
  gallery: PlaceImage[];
  curiosities: string[];
  nearbyPlaceIds: string[];
  status: 'pendiente' | 'visitado';
}
export interface Activity extends PartialTravelDetails { completed?:boolean;  transportId?:string; hotelId?:string; departureTimeZone?:string; arrivalTimeZone?:string;  id: string; title: string; start?: string | null; end?: string | null; location: string; category: string; note: string; placeId?: string }
export interface Day { summary?:string; featuredPlaceId?:string; cities?:string[]; luggage?:string; hotelId?:string;  id: string; date: string; city: string; title: string; subtitle: string; activities: Activity[]; timeZone?: string }
export interface TripSettings {name:string;startDate:string;endDate:string}
export interface Hotel extends PartialTravelDetails { howToArrive?:string; tips?:string[]; imageCredit?:string; description?:string; imageUrl?:string; source?:string; id:string;city:string;name:string;area:string;checkIn?:string|null;checkOut?:string|null;status?:Status|'Confirmado'|''|null;location:string;note:string}
export interface Transport extends PartialTravelDetails { departureAt?:string|null; arrivalAt?:string|null; arrivalDate?:string|null; arrivalTime?:string|null; departureTimeZone?:string; arrivalTimeZone?:string; flightNumber?:string|null; terminal?:string|null; gate?:string|null; id:string;type:string;title:string;from:string;to:string;date?:string|null;time?:string|null;status?:Status|'Confirmado'|'confirmado'|'pendiente de reservar'|'no requiere reserva'|''|null;location:string;note:string}
export interface TripData { wishlist?:WishlistEntry[]; catalogRevision?:number; confirmedTravelRevision?:number; version:2;settings:TripSettings;places:Place[];itinerary:Day[];hotels:Hotel[];transport:Transport[];tasks:Task[]}

export interface WishlistEntry {id:string;name:string;city:string;category:string;latitude?:number|null;longitude?:number|null;priority?:Priority;favorite:boolean;note:string;mapsUrl?:string;imageUrl:string;gallery?:PlaceImage[]}

import { Link } from 'react-router-dom';
import type { Place } from '../types';
import { Photo } from './ui';
export function PlacePreview({place}:{place:Place}) {
 const image=place.gallery.find(i=>i.src===place.imageUrl);
 return <div className="itinerary-photo"><Link to={`/lugares/${encodeURIComponent(place.id)}`} aria-label={`Ver lugar: ${place.name}`}>{place.imageUrl?<Photo photo={image??{src:place.imageUrl,alt:place.name}}/>:<div className="gallery-placeholder"><span>{place.name}</span><small>Fotografía pendiente de confirmar</small></div>}</Link>{image?.credit&&<p className="small muted">{image.source?<a href={image.source} target="_blank" rel="noreferrer">{image.credit}</a>:image.credit} · {image.licenseUrl?<a href={image.licenseUrl} target="_blank" rel="noreferrer">{image.license}</a>:image.license}</p>}</div>;
}

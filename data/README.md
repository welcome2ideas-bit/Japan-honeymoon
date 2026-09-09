# Datos reales del viaje

El catálogo contiene el recorrido real del 17 de noviembre al 4 de diciembre de 2026: 18 días, 51 lugares, seis alojamientos y seis vuelos confirmados. Los siete trayectos terrestres conservan sus horarios y reservas pendientes. No contiene datos personales ni credenciales de reserva.

`places.json` contiene las fichas del itinerario. `itinerary.json` enlaza actividades mediante `placeId`, `transportId` y `hotelId`; cada día tiene `summary`, `featuredPlaceId`, ciudades y equipaje. `food.json` contiene las especialidades elegidas por destino. Las fotografías remotas incluyen fuente, autor y licencia cuando proceden de Wikimedia. Los hoteles conservan las fotografías de sus sitios oficiales donde estaban verificadas. La ausencia o el fallo de una imagen muestra un placeholder.

`wishlist.json` es una lista independiente, inicialmente vacía y pendiente de importar. Wishlist acepta CSV de listas guardadas, GeoJSON y JSON, permite revisar los registros antes de importarlos y evita duplicados por identificador o nombre y ciudad. No lee automáticamente una lista privada ni transforma un enlace compartido de Google Maps en lugares. Las notas, favoritos y coordenadas pertenecen a esta lista y no modifican el itinerario.

Las duraciones, prioridades y mejores momentos de visita son sugerencias de planificación, no horarios reservados. Las coordenadas solo se rellenan cuando hay una referencia fiable. Los campos desconocidos se dejan vacíos o nulos y se presentan como «Pendiente de confirmar». Las tareas incluyen prioridad, estado y fecha recomendada opcional, sin inventar ventanas de reserva.

«Ahora» se abre al iniciar la app durante las fechas del viaje. Identifica actividades actuales únicamente con horarios suficientes y zonas horarias explícitas; distingue el próximo horario confirmado del próximo plan sin completar. El progreso es manual o por lugares marcados como visitados. Inicio sigue accesible desde la navegación.

«Qué tengo cerca» pide ubicación solo al pulsar el botón, calcula distancias en el dispositivo y no guarda ni envía la posición. Necesita HTTPS o localhost. La lista se ordena por distancia en línea recta; no representa una ruta a pie.

## Importar

Utilizar `import-template.json`: `version: 2`, `settings`, `places`, `itinerary`, `hotels`, `transport` y `tasks`. Todas las listas son obligatorias; pueden estar vacías. Ajustes permite descargar esta estructura, seleccionar un JSON de hasta 5 MB, revisar los recuentos, descargar una copia de los datos actuales y confirmar la sustitución. Una importación inválida no cambia los datos. El archivo exportado puede importarse de nuevo.

La aplicación inicia con los archivos de esta carpeta y guarda los cambios en `jh-trip-v2` en el navegador. Cuando existe un viaje guardado, prevalece sobre los archivos iniciales. Importar actualiza todas las pantallas de forma conjunta. No hay sincronización entre dispositivos.

## Lugar

Campos obligatorios de cada objeto en `places`:

| Campo | Formato |
| --- | --- |
| `id` | Texto único, estable y no vacío |
| `name`, `city` | Texto no vacío |
| `category`, `note` | Texto; vacío si aún no se conoce |
| `imageUrl` | URL HTTPS de portada o texto vacío |
| `gallery` | Lista de imágenes `{ "src": URL_HTTPS, "alt": TEXTO }`; admite `credit` y `source` HTTPS opcionales |
| `curiosities` | Lista de textos; vacía si falta información |
| `nearbyPlaceIds` | Lista de IDs existentes de otros lugares, seleccionados explícitamente; no se inventan por distancia |
| `favorite` | Booleano |
| `status` | `pendiente` o `visitado` |

Campos opcionales: `description`, `whyVisit`, `bestTime`, `timingBasis` (textos), `tips` y `typicalFood` (listas), `durationMinutes` (número positivo), `priority` (`Imprescindible`, `Nos gustaría`, `Si hay tiempo`), `mapsQuery`, `latitude` y `longitude` (ambas numéricas o ambas desconocidas), `coordinateSource` y `sources`. Las imágenes admiten `license` y `licenseUrl`. Omitir información desconocida.

La portada se muestra primero y después la galería. No se descargan imágenes al proyecto: se cargan por HTTPS desde el proveedor. Las imágenes que fallan muestran una alternativa visual. Se necesita conexión y el proveedor debe permitir servir las imágenes. Las fotografías editoriales de Inicio se configuran por separado en `visuals.json`; no añaden lugares al catálogo.

## Itinerario

Cada día: `id`, `date` (`YYYY-MM-DD`), `city`, `title`, `subtitle`, `activities`.

Cada actividad: `id` único en todo el viaje, `title`, `location`, `category`, `note`. `start` y `end` son opcionales: vacíos, nulos u horarios ISO con zona explícita; si se conocen ambos, el fin debe ser posterior. Para visitas, incluir `placeId`; para transportes, `transportId`. Los enlaces usan la información confirmada del catálogo de transportes. `completed` registra la marca manual del plan.

## Otros catálogos

- Hoteles: `id`, `city`, `name`, `area`, `checkIn`, `checkOut`, `status`, `location`, `note`. Salida posterior a entrada.
- Transportes: `id`, `type`, `title`, `from`, `to`, `date`, `time`, `status`, `location`, `note`.
- Tareas (`checklist.json`, `tasks` en el archivo de importación): `id`, `title`, `category`, `status`.
- Estados de tareas: `Pendiente`, `Reservado`, `Completado`. Hoteles y transportes también admiten `Confirmado` y estados pendientes según su catálogo.
- `settings`: `name`, `startDate`, `endDate`. Ambas fechas vacías o ambas válidas, con fin igual o posterior al inicio.

## Migración

Las claves anteriores del navegador se conservan para recuperación. La actualización del catálogo se aplica al viaje con las mismas fechas y conserva favoritos, notas, visitas, tareas y planes completados. Lugares e Itinerario comparten fichas; Wishlist mantiene sus propios registros. No se modifica una importación con fechas diferentes.

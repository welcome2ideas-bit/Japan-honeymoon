# Japan Honeymoon — guía del proyecto

**Leer este documento antes de modificar el proyecto en futuras sesiones.** Continuar desde el estado existente. No recrear la aplicación, cambiar el diseño general ni refactorizar componentes estables sin necesidad.

## Arquitectura

Aplicación estática React + TypeScript, Vite, Tailwind CSS y React Router (`HashRouter`). `src/main.tsx` monta React, el proveedor del viaje, las rutas y los límites de error. Las páginas se cargan de forma diferida. `base: './'` permite alojar el resultado en un subdirectorio de GitHub Pages.

`src/context.tsx` carga y valida los JSON, expone el estado y guarda los cambios en el navegador (`jh-trip-v2`). La apariencia se guarda por separado. No hay servidor, autenticación, sincronización entre dispositivos ni almacenamiento remoto. Exportar e importar permite trasladar los cambios. No guardar información sensible.

`src/pages/` contiene las pantallas existentes. `src/components/` contiene tarjetas, galería, fotografía con fallback, resumen de alojamientos y transportes, gastronomía, cercanía y planificación del día. Reutilizar estos componentes y sus clases CSS.

`src/lib/import.ts` valida los datos antes de aceptarlos. `confirmed-travel.ts` conecta los transportes con el itinerario. `catalog-update.ts` aplica actualizaciones de contenido al viaje de las mismas fechas y conserva notas, favoritos, visitas, tareas y actividades completadas. Las migraciones deben ser idempotentes y no sustituir la Wishlist. Incrementar la revisión solamente cuando hay una nueva actualización que trasladar a los navegadores existentes.

## Estructura de datos

Todo contenido del viaje está en `data/`:

| Archivo | Contenido |
| --- | --- |
| `trip.json` | Nombre, fechas y descripción general |
| `itinerary.json` | Días, actividades y referencias a lugares, hoteles y transportes |
| `places.json` | Fichas reales del itinerario |
| `hotels.json` | Alojamientos confirmados y logística |
| `transport.json` | Vuelos confirmados y trayectos terrestres pendientes |
| `food.json` | Especialidades y bloques visuales por destino |
| `checklist.json` | Tareas, prioridad y estado |
| `wishlist.json` | Lista independiente; permanece vacía hasta importar datos reales |
| `visuals.json` | Fotografías de Inicio y sus atribuciones |
| `import-template.json` | Estructura vacía del viaje completo, versión 2 |
| `wishlist-template.json` | Estructura vacía de la Wishlist |

La exportación completa tiene `version: 2`, `settings`, `places`, `itinerary`, `hotels`, `transport`, `tasks` y `wishlist` opcional. Conservar identificadores únicos y estables. No introducir datos ficticios para cubrir campos vacíos.

## Añadir días

En `itinerary.json`, añadir un día con `id`, `date` (`YYYY-MM-DD`), `city`, `title`, `subtitle` y `activities`. Se admiten `summary`, `tips`, `cities` (gastronomía contextual), `luggage`, `hotelId`, `featuredPlaceId` y `timeZone`. El lugar destacado debe existir en `places.json`; su foto ilustra el destino y no añade una visita nueva.

Cada actividad tiene `id` único en todo el viaje, `title`, `location`, `category` y `note`. Para visitas usar `placeId`. Para transportes usar `transportId`; para entradas/salidas del hotel usar `hotelId`. No duplicar fichas ni copiar horarios independientes que puedan divergir.

`start` y `end` se dejan vacíos o nulos si no están confirmados. Cuando se conocen, usar ISO con zona explícita, por ejemplo el patrón `YYYY-MM-DDTHH:mm:ss+09:00`; no poner este patrón literal como dato. El inicio pertenece al día indicado; el fin puede cruzar medianoche y debe ser posterior. Los vuelos mantienen zonas distintas de salida y llegada.

Para visitas sin hora, `suggestedBlock` admite `Mañana`, `Mediodía`, `Tarde` o `Noche`. La interfaz dice **Horario orientativo**. Estos bloques no se convierten en horas reales ni se usan para afirmar que una actividad está ocurriendo. Se asignan después de los vuelos y alrededor de los traslados existentes, sujetos a sus horarios futuros.

Marcar `flexible: true` únicamente en visitas que pueden cambiar de orden; usar `locked: true` cuando su posición deba conservarse, incluso si falta la hora. El estado del día se calcula con actividades completadas y lugares visitados; pasar la fecha no marca visitas automáticamente.

## Optimización del día

`src/lib/day-planning.ts` reorganiza solamente grupos consecutivos de visitas explícitamente flexibles, de la misma ciudad y bloque, con coordenadas fiables. Las reservas, cualquier extremo horario confirmado, transportes, hoteles, actividades bloqueadas/completadas, lugares visitados y coordenadas ausentes forman barreras. Nunca cruzarlas.

Se usa una mejora local 2-opt sobre distancias geográficas en línea recta, con los puntos fijos adyacentes cuando están disponibles. Solo se aplica una reducción real del coste estimado, sin modificar los objetos de las actividades. Se limita a grupos de hasta 40 visitas. No es un servicio de rutas, no calcula tiempos a pie ni garantiza el óptimo global. La pantalla permite deshacer inmediatamente mientras no haya otros cambios en las actividades.

## Añadir hoteles

En `hotels.json`, usar `id`, `name`, `city`, `area`, `location`, `note` y las fechas reales `checkIn`/`checkOut`. `status` admite `Confirmado`. La salida debe ser posterior a la entrada. `description`, `howToArrive`, `tips`, `imageUrl`, `imageCredit` y `source` completan la ficha. No deducir una hora de check-in de las fechas de la estancia ni de horarios genéricos publicados.

Los hoteles se muestran en los resúmenes del día por fechas; en días de cambio aparecen la salida del alojamiento anterior y la nueva estancia. Mantener las fechas confirmadas. Dirección pública y estación pueden verificarse en fuentes fiables; instrucciones privadas de acceso no se publican.

## Añadir transportes

En `transport.json`, usar `id`, `type`, `title`, `from`, `to`, `location`, `note` y, cuando se conozcan, `date`, `time`, `status`. Para vuelos se admiten `departureAt`, `arrivalAt`, `arrivalDate`, `arrivalTime`, `departureTimeZone` y `arrivalTimeZone`. Conservar los horarios locales confirmados, incluido el cambio de fecha en Hong Kong.

`trainNumber`, `flightNumber`, `platform`, `seat`, `terminal`, `gate`, `durationMinutes` y `reservation` son opcionales. Se muestran como **Pendiente de confirmar** si están vacíos. No añadir localizadores, billetes, QR, documentos, precios de reserva ni datos personales.

Vincular la actividad con `transportId` para que Itinerario, Transportes, Ahora y el resumen del día usen el mismo registro. Antes de cambiar la conexión, ejecutar las pruebas de vuelos entre zonas horarias y de extremos incompletos.

## Añadir lugares

En `places.json`, usar `id`, `name`, `city`, `category`, `note`, `favorite`, `status`, `imageUrl`, `gallery`, `curiosities` y `nearbyPlaceIds`. `status` admite `pendiente` o `visitado`. Las listas pueden estar vacías y `imageUrl` puede ser `""`.

Completar `description`, `whyVisit`, `tips`, `typicalFood`, `bestTime`, `durationMinutes` y `priority` cuando haya información. Duración, prioridad y mejor momento son recomendaciones, no reservas. Prioridad: `Imprescindible`, `Nos gustaría` o `Si hay tiempo`. En alojamientos no inventar una duración de visita.

`latitude` y `longitude` deben ser numéricas y fiables, ambas presentes o ambas desconocidas; registrar `coordinateSource`. No estimar coordenadas a partir de otro lugar cercano. Las fichas sin coordenadas siguen funcionando y quedan fuera del cálculo de cercanía. `mapsQuery` abre una búsqueda por nombre o dirección y `sources` conserva fuentes HTTPS.

No revisar las imágenes ya correctas sin motivo. Para imágenes nuevas, verificar que el archivo representa el lugar y que la licencia permite su reutilización. Preferir Wikimedia Commons. Cada imagen incluye `src` HTTPS, `alt` español, `credit`, `source`, `license` y `licenseUrl` cuando corresponda. Las fotografías existentes de sitios oficiales de hoteles no se presentan como imágenes con licencia libre. Si no hay una imagen reutilizable verificada, conservar el placeholder. No inventar URLs ni sustituir un hotel por una foto de otro.

## Añadir gastronomía

En `food.json`, añadir un registro por `city` con `dishes` (lista de especialidades), `highlight`, `description`, `gallery`, `imageCaption`, `note` y `source`. `FoodToday` lo conecta por `day.cities` o `day.city`. Mantener los bloques «Qué comer hoy», «Especialidades» y «No te vayas sin probar…». Fotografías y textos no implican restaurante ni reserva; no inventar establecimientos.

## Importar Wishlist

La lista es independiente de Lugares e Itinerario. La importación no debe borrar lo guardado ni convertir favoritos del catálogo en una Wishlist ficticia. En esta sesión la revisión automática impidió abrir el enlace compartido; no se ha podido inspeccionar ni importar su contenido. No atribuir ese bloqueo a una limitación confirmada de Google Maps.

Formato recomendado: **CSV UTF-8** de la lista exportada de Google Maps/Google Takeout, con cabeceras **`Title,Note,URL`**. `Title` es obligatorio; `Note` y `URL` pueden quedar vacíos. Se admiten además `City` y `Category`. Si una celda contiene comas, debe ir entre comillas. No usar capturas de pantalla como sustituto del archivo.

También se acepta JSON con una lista de lugares o `{ "version": 1, "wishlist": [] }`, rellenando esa lista con los registros reales. Cada registro requiere `name`; admite `id`, `city`, `category`, `latitude`, `longitude`, `priority`, `favorite`, `note`, `mapsUrl` e `imageUrl`. `favorite` es booleano; imágenes y enlaces usan HTTPS; Google Maps debe pertenecer a un dominio admitido por el importador.

GeoJSON: `FeatureCollection` con puntos `[longitude, latitude]` y propiedades `Title`/`name`, `Comment`/`note`, `city`, `category`, `GoogleMapsURL`/`Google Maps URL`. Archivos hasta 5 MB y 1000 lugares. La UI muestra una vista previa antes de combinar registros y conserva los lugares existentes ante duplicados.

## Ahora y geolocalización

Antes del viaje, Ahora muestra cuenta atrás; durante el viaje muestra el día y los horarios reales disponibles; después muestra «Viaje completado» sin alterar los estados personales. Las fechas inicial y final se evalúan con la zona horaria de sus jornadas. Una entrada inicial a la raíz durante el viaje abre Ahora, pero Inicio sigue accesible.

La ubicación se solicita únicamente al pulsar «Buscar cerca de mí». Se compara localmente con Lugares y Wishlist, se ordena por distancia y no se almacena ni se transmite a un servicio de rutas. Se necesita HTTPS o localhost. La denegación del permiso debe mostrar un mensaje recuperable, no dejar la pantalla en blanco.

## Reglas y comprobaciones

- Trabajar solo en los archivos necesarios; conservar diseño, arquitectura y datos reales.
- Mantener la interfaz en español y todos los campos desconocidos como **Pendiente de confirmar**.
- No interpretar bloques orientativos como horarios confirmados ni mover reservas reales.
- No almacenar nombres de viajeros, contactos privados, localizadores, QR, documentos ni pagos.
- Antes de finalizar ejecutar `npm test` y `npm run build`; corregir los errores.
- Verificar las pantallas afectadas en navegador, el tamaño móvil y la navegación. Compilar no equivale a renderizar.
- `npm run dev` inicia el desarrollo; `npm run preview` permite comprobar `dist` después de compilar. `start.ps1` usa el runtime disponible en este equipo.
- Las comprobaciones temporales viven en `.tmp/`, están ignoradas por Git y nunca entran en `dist`. Los datos simulados de prueba no se incorporan al catálogo real.

## Pendiente de información real

Reservas y horarios de trenes, buses, entradas y traslados; instrucciones específicas de los alojamientos y del envío de equipaje; archivo exportado de la Wishlist. Algunas coordenadas y fotografías de hoteles continúan sin verificación y usan los estados previstos. El resto del contenido existente no se debe recrear en la siguiente sesión.

## Revisión final del itinerario

Los 51 lugares del catálogo ya están asignados; no se han añadido destinos. Se corrigieron los bloques nocturnos del 28 y 30 de noviembre, el orden del 30 y los bloques de compras alternativas del 1 y 2 de diciembre. Las indicaciones orientativas se guardan en `suggestedBlock` y `planningNote`, separadas de `start`/`end` reales. `optional` identifica alternativas. La migración `itineraryReviewRevision: 1` conserva estados y reservas.

La importación de Wishlist mantiene registros independientes y añade referencias `wishlistIds` únicamente a cuatro huecos existentes: 30 de noviembre por la tarde (cerca de Shinjuku), 1 de diciembre mañana/tarde y 2 de diciembre mañana. Máximo un lugar por hueco y dos al día. No añade actividades ni ocupa jornadas con transporte o reservas. Exige ciudad y coordenadas; limita a 2 km en línea recta desde el ancla o la primera propuesta del día. No calcula rutas ni horarios de transporte. Cada hueco tiene 120 minutos de margen: duración facilitada más 30 minutos, o 90 más 30 si se desconoce (supuesto de planificación, nunca duración confirmada).

JSON y GeoJSON admiten `durationMinutes`, `openingHours: [{date, opens, closes}]` (fecha YYYY-MM-DD, horas locales HH:mm) y `closedDates`. Se comprueba compatibilidad si se facilitan; apertura desconocida queda pendiente y la propuesta es flexible. CSV admite además `Latitude`, `Longitude` y `DurationMinutes`. Sin información suficiente o sin hueco, el lugar permanece en Wishlist pendiente de encajar. Los duplicados conservan notas, favoritos e identificadores; solo se completan campos vacíos.

## Comprobación de estabilidad (10 septiembre 2026)

El fallo observado en el navegador fue `Failed to fetch dynamically imported module` al abrir Places/Itinerary, acompañado de desconexión de Vite. Se comprobó conexión rechazada en localhost:5173: el servidor de desarrollo estaba detenido, mientras Inicio permanecía en memoria. Se restableció Vite en segundo plano y se recargó el navegador; los módulos volvieron a responder HTTP 200. No se cambiaron componentes, diseño ni datos para ocultar el error. En futuras sesiones, comprobar primero que el servidor está activo. `start.ps1` o `npm run dev` deben permanecer ejecutándose durante el uso local; GitHub Pages sirve la carpeta compilada `dist` sin depender de ese proceso.

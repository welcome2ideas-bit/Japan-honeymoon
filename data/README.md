# Datos reales del viaje

Todos los catálogos parten vacíos. Las fechas están vacías hasta que se confirmen. No hay reservas, rutas ni lugares ficticios.

`places.json` contiene el catálogo único. `itinerary.json` contiene días y actividades que enlazan al catálogo mediante `placeId`. No se duplica la ficha por cada visita. Wishlist muestra los favoritos del mismo catálogo; `wishlist.json` se conserva vacío por compatibilidad de estructura, no es otra base de lugares.

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

Campos opcionales: `description` (texto), `tips` (lista de textos), `typicalFood` (lista de textos), `durationMinutes` (número positivo), `priority` (`Imprescindible`, `Nos gustaría`, `Si hay tiempo`), `mapsQuery` (consulta de ubicación). Omitir información desconocida. La ficha tiene un estado vacío para cada apartado.

La portada se muestra primero y después la galería. No se descargan imágenes al proyecto: se cargan por HTTPS desde el proveedor. Las imágenes que fallan muestran una alternativa visual. Se necesita conexión y el proveedor debe permitir servir las imágenes. Las fotografías editoriales de Inicio se configuran por separado en `visuals.json`; no añaden lugares al catálogo.

## Itinerario

Cada día: `id`, `date` (`YYYY-MM-DD`), `city`, `title`, `subtitle`, `activities`.

Cada actividad: `id` único en todo el viaje, `title`, `start`, `end`, `location`, `category`, `note`. Horarios ISO `YYYY-MM-DDTHH:mm:ss+09:00`, inicio en la fecha del día y fin posterior. Para visitas, incluir `placeId` con el ID de un lugar; la tarjeta abre su ficha. Es opcional para actividades que no son visitas, como un traslado.

## Otros catálogos

- Hoteles: `id`, `city`, `name`, `area`, `checkIn`, `checkOut`, `status`, `location`, `note`. Salida posterior a entrada.
- Transportes: `id`, `type`, `title`, `from`, `to`, `date`, `time`, `status`, `location`, `note`.
- Tareas (`checklist.json`, `tasks` en el archivo de importación): `id`, `title`, `category`, `status`.
- Estados de hoteles, transportes y tareas: `Pendiente`, `Reservado`, `Completado`.
- `settings`: `name`, `startDate`, `endDate`. Ambas fechas vacías o ambas válidas, con fin igual o posterior al inicio.

## Migración

Las claves anteriores del navegador se conservan para recuperación. Se excluyen los ejemplos reconocidos que no se modificaron y se trasladan tareas y lugares personales compatibles. Las fechas predeterminadas del prototipo se vacían. Favoritos y visitas se guardan una sola vez por lugar, compartidos entre Lugares, Wishlist e Itinerario.

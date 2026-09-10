# Japan Honeymoon

Antes de continuar el desarrollo, leer [PROJECT_GUIDE.md](PROJECT_GUIDE.md): datos, reglas, planificación, importación y comprobaciones.

Nuestra aplicación para organizar la luna de miel en Japón (noviembre de 2026). React, TypeScript, Vite, Tailwind CSS y React Router. Diseño responsive con barra inferior, áreas seguras de iPhone y animaciones que respetan la preferencia de movimiento reducido.

## Ejecutar

Requiere Node.js 22 y npm.

En este ordenador las dependencias ya están instaladas y también se puede iniciar desde PowerShell con `./start.ps1`. El script utiliza Node del sistema o el runtime disponible de Codex.

```sh
npm install
npm run dev
```

Abrir la dirección que muestra Vite. Para probar desde un iPhone en la misma red, usar la IP local del ordenador y el puerto 5173.

```sh
npm test
npm run build
npm run preview
```

## Datos y uso

El contenido real vive en `data/`, separado de las pantallas: 18 días de viaje, 51 lugares, seis hoteles y seis vuelos confirmados, más los trayectos terrestres pendientes de reserva. Consulta [el contrato de datos](data/README.md) y [la estructura vacía de importación](data/import-template.json).

- **Lugares**: catálogo por ciudad con búsqueda, favoritos, fichas completas y estado pendiente/visitado.
- **Itinerario**: actividades con `placeId` que abren la misma ficha de Lugares.
- **Wishlist**: lista independiente, pendiente de importar desde CSV, GeoJSON o JSON. Vista previa, favoritos, notas y filtros, sin modificar el itinerario.
- **Ajustes**: importación validada con vista previa, exportación completa, nombre, fechas y apariencia.
- **Inicio, Ahora, Transportes, Hoteles y Pendientes**: usan el mismo estado del viaje.

Durante el viaje, una entrada inicial abre Ahora, con progreso manual, siguiente plan, horarios confirmados, equipaje, alojamiento y gastronomía. Se puede volver a Inicio desde la barra inferior. La ubicación se solicita únicamente al usar «Buscar cerca de mí» y se procesa en el dispositivo. En un iPhone necesita HTTPS; una IP local con HTTP no permite geolocalización.

Cada lugar admite `imageUrl`, `gallery`, descripción, curiosidades, comida típica, consejos, duración, prioridad, Google Maps y referencias a lugares cercanos. Todo lo desconocido queda vacío. Las fotografías son remotas (HTTPS), incluidas las editoriales de Inicio; no se incluyen archivos de fotografía en la aplicación. Se necesita conexión y un proveedor que permita cargar las imágenes. Si fallan, la ficha mantiene su contenido y muestra una alternativa visual.

Los datos se guardan en este navegador, con aviso si falla la escritura. No hay sincronización entre dispositivos. Exportar e importar permite trasladar el viaje. Las claves del prototipo se conservan como respaldo; la migración excluye los ejemplos reconocidos sin cambios y conserva los registros personales compatibles.

El diseño general, modo claro/oscuro/sistema y navegación móvil se mantienen. No se ha cambiado la estructura de carpetas existente; las nuevas pantallas y utilidades viven en `src/pages` y `src/lib`.

## GitHub Pages

El flujo `.github/workflows/deploy.yml` instala dependencias, ejecuta pruebas, compila y despliega al hacer push a `main` o ejecutarlo manualmente. En el repositorio, activar **Settings → Pages → Source → GitHub Actions**. No se ha publicado automáticamente desde el entorno local.

Se usa `base: './'` y `HashRouter` para admitir subdirectorios y recargas de rutas sin errores 404. Referencias: [despliegue de Vite](https://vite.dev/guide/static-deploy.html) e [integración de Tailwind con Vite](https://tailwindcss.com/docs/installation/using-vite).

GitHub Pages sirve una web estática; esta versión no tiene autenticación. No incluir datos personales sensibles ni confirmaciones de reserva en los JSON publicados.

# Pruebas de incidencias con Postman y Newman

Ejecutar desde la raíz del repositorio con el backend ya disponible en `http://localhost:8081` y sus usuarios y ubicaciones de prueba cargados. La colección usa Postman v2.1 y el entorno define `baseUrl = http://localhost:8081/api/v1`.

```sh
npx -y newman run postman/incidencias.postman_collection.json -e postman/local.postman_environment.json -r cli,json,htmlextra --reporter-json-export docs/evidencias/newman/resultado.json --reporter-htmlextra-export docs/evidencias/newman/reporte.html
```

Si `npx` no encuentra `htmlextra`, instalar ambos paquetes fuera del repositorio y ejecutar:

```sh
npm i --prefix /tmp/newman-tools newman newman-reporter-htmlextra
mkdir -p docs/evidencias/newman
NO_COLOR=1 FORCE_COLOR=0 /tmp/newman-tools/node_modules/.bin/newman run \
  postman/incidencias.postman_collection.json \
  -e postman/local.postman_environment.json -r cli,json,htmlextra --color off \
  --reporter-json-export docs/evidencias/newman/resultado.json \
  --reporter-htmlextra-export docs/evidencias/newman/reporte.html \
  > docs/evidencias/newman/salida.txt 2>&1
```

Consultar el código de salida de Newman: cero indica que todas las assertions pasaron; un valor distinto indica fallos. No se usa `--suppress-exit-code`. Para guardar dos corridas sin sobrescribirlas, usar `docs/evidencias/newman/corrida-1/` como destino de los tres archivos de la primera ejecución y los destinos anteriores para la segunda.

En Postman, importar colección y entorno, seleccionar el entorno local y ejecutar la colección completa en el orden de sus carpetas. No ejecutar carpetas aisladas: dependen del login y de la incidencia creada durante esa corrida.

## Qué valida cada carpeta

- **00 Login de los 5 usuarios:** autentica Ana, Bruno, Carlos, Diana y Elena con `Incidencias2026`. Comprueba token, vigencia, identidad y rol (RNF1). Guarda tokens, IDs y nombres como variables de colección; limpia las variables al comenzar para evitar reutilizar datos de otra corrida.
- **01 Registrar:** consulta ubicaciones y verifica las ubicaciones 1 a 6; elige una del catálogo. Ana crea una incidencia con descripción identificada mediante GUID, estado REPORTADA y técnico nulo (RN2). Rechaza registros de técnico/coordinador (RNF1), cada campo obligatorio ausente, descripción vacía o fuera de 10..1000 con `campos` (RN1), y ubicación inexistente con 422.
- **02 Consultar:** verifica listas de los cinco usuarios, propiedad de cada fila según su rol, presencia o ausencia de la incidencia creada y filtros por estado. Ana accede al detalle; Bruno recibe 403 tanto en detalle como en historial (RN7). No presupone listas vacías ni cantidades globales.
- **03 Asignar:** obtiene `/usuarios?rol=TECNICO`, exige que Carlos y Diana sean técnicos y contrasta sus IDs con el login; usa los IDs descubiertos para asignar. Rechaza asignaciones por usuario/técnico (403), destino no técnico (422) y reasignación (409). Elena asigna a Carlos y el estado queda ASIGNADA (RN3/RNF1). Carlos la ve en su lista; Diana no puede listar esa incidencia ni acceder al detalle o historial (RN7).
- **04 Actualizar estado:** rechaza cambios por usuario/coordinador (RNF1), técnico no asignado (RN5), salto directo a RESUELTA, ASIGNADA mediante el endpoint de estado, retroceso y cambios desde RESUELTA (RN4). Carlos avanza ASIGNADA → EN_PROCESO → RESUELTA.
- **05 Seguimiento:** Ana, Elena y Carlos obtienen exactamente cuatro filas, en orden REPORTADA, ASIGNADA, EN_PROCESO, RESUELTA, con `estadoAnterior` encadenado desde null (RN6/RN7). Contrasta `realizadoPor` con los nombres del login de Ana, Elena, Carlos y Carlos; verifica roles y fechas válidas y cronológicas. Consulta listas filtradas y detalle final.
- **06 Seguridad:** sin token, token basura y credenciales malas producen 401 (RNF1).

Cada request incluye `pm.test` con nombres en español y referencia a su regla. Los negativos verifican también el formato de error con `message`, `httpStatus` y `timestamp`; los casos de validación de campos exigen `campos`. Los fallos no alteran las expectativas para adaptarse al backend.

## Reejecución y evidencia obtenida

Cada corrida crea su propia incidencia y guarda `incidenciaId`; no fija IDs de usuarios ni depende de una incidencia anterior. Solo utiliza los endpoints REST autorizados, sin reiniciar servicios, ejecutar SQL ni modificar backend/frontend. No borra las incidencias creadas: el contrato no proporciona un endpoint de eliminación.

Se realizaron dos corridas consecutivas con los tres reporters: **56 requests y 125 assertions por corrida, sin fallos**. La primera creó la incidencia **3** y la segunda la **4**, ambas finalizaron RESUELTA. El catálogo confirmó Carlos con ID 3 y Diana con ID 4, coincidentes con sus logins; estos valores no están hardcodeados en la colección.

Archivos de evidencia:

- `docs/evidencias/newman/corrida-1/resultado.json`, `reporte.html` y `salida.txt`: primera corrida completa.
- `docs/evidencias/newman/resultado.json`, `reporte.html` y `salida.txt`: segunda corrida completa.
- `docs/evidencias/newman/intento-npx/resultado.json` y `salida.txt`: intento inicial con el comando solicitado; pasó los mismos 56 requests y 125 assertions y creó la incidencia 2, pero Newman no encontró `htmlextra`. Por ello se instalaron los paquetes en `/tmp/newman-tools` y se hicieron las dos corridas completas anteriores.

Los archivos `salida.txt` no contienen códigos ANSI de color. Los reportes conservan respuestas y datos de autenticación de prueba; contienen los detalles de cada request y assertion. No se hicieron commits.

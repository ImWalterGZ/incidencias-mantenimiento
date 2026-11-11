# Ejercicio 3 · Matriz final de correspondencia

**DIAGRAMA → ELEMENTO MODELADO → IMPLEMENTACIÓN → PRUEBA → EVIDENCIA**

Cada fila parte de un elemento de la matriz inicial y llega a un archivo y línea del repositorio, a la prueba que lo ejercita y al archivo donde quedó el resultado. Las rutas de código son relativas a `backend/src/main/java/com/incidencias/` salvo que digan otra cosa. Las pruebas de Postman se nombran como «carpeta › request» de `postman/incidencias.postman_collection.json`.

## Resultados globales

| Prueba | Resultado | Archivo |
|---|---|---|
| Pruebas unitarias del servicio (JUnit 5 + Mockito) | 11 de 11 pasan | `docs/evidencias/junit.txt` |
| Colección de Postman ejecutada con newman, corrida 1 | 56 requests, 125 assertions, 0 fallos | `docs/evidencias/newman/corrida-1/` |
| Misma colección, corrida 2 sobre la misma base (demuestra que es re-ejecutable) | 56 requests, 125 assertions, 0 fallos | `docs/evidencias/newman/salida.txt`, `reporte.html` |
| Flujo completo en la interfaz con Playwright (Chromium) | Ana reporta → Elena asigna → Carlos avanza dos veces → Ana ve 4 entradas | `docs/evidencias/capturas/01…05` |
| Consultas a PostgreSQL | Migraciones aplicadas, restricciones y conteo de historial | `docs/evidencias/bd-consultas.txt` |

## Matriz

| # | Diagrama | Elemento modelado | Implementación | Prueba | Evidencia |
|---|---|---|---|---|---|
| 1 | Clases; entidad-relación | **Incidencia** con ubicación, categoría, descripción, prioridad, fecha y estado (RN1) | `model/IncidenciaModel.java:24`; tabla en `backend/src/main/resources/db/migration/V1__esquema_inicial.sql:20`; validación en `dto/IncidenciaRequestDto.java` | Postman «01 › Rechazar campo obligatorio ausente: ubicacionId / categoria / descripcion / prioridad» (400 con `campos`); Flyway con `ddl-auto: validate` | `newman/salida.txt` (carpeta 01); `bd-consultas.txt` (Flyway V1 y V2 con `success = t`; columnas `NOT NULL`) |
| 2 | Casos de uso; secuencia «registrar» | **Registrar incidencia**, que siempre nace Reportada (RF3, RN2) | `controller/IncidenciaController.java:42` → `service/IncidenciaService.java:62`; estado fijado en la línea 73 | JUnit `registrarIniciaComoReportada`, `registrarConUbicacionInexistente`; Postman «01 › Registrar incidencia propia de Ana» (201, `REPORTADA`, técnico nulo) y «Rechazar ubicación inexistente» (422) | `junit.txt`; `newman/salida.txt`; captura `02-usuario-reporta.png` |
| 3 | Casos de uso; secuencia «estado»; estados | **Asignar técnico**: solo el coordinador, solo a un técnico, solo desde Reportada y sin reasignar (RF7, RN3) | Ruta restringida en `config/SecurityConfig.java:67`; `IncidenciaController.java:72` → `IncidenciaService.java:104`; 409 en la 107 y 422 en la 111; restricción de base en `V1__esquema_inicial.sql:31` | JUnit `asignarTecnico`, `asignarANoTecnico`, `noSeReasigna`; Postman «03 › Elena asigna a Carlos» (200), «Rechazar destino no técnico» (422), «Rechazar reasignación a Diana» (409), «Rechazar asignación por ana / carlos» (403) | `newman/salida.txt` (carpeta 03); `bd-consultas.txt` (el `UPDATE` manual a ASIGNADA sin técnico lo rechaza `incidencia_tecnico_segun_estado`); captura `03-coordinador-asigna.png` |
| 4 | Estados | **Máquina de estados** Reportada → Asignada → En proceso → Resuelta, sin saltos ni retrocesos (RN4) | `enums/EstadoIncidencia.java:14` (`siguiente()`); se valida en `IncidenciaService.java:122`, con 409 en la 136 | JUnit `siguienteEstado`, `avanzarEstados`, `noSeSaltanEstados`, `resueltaEsFinal`; Postman «04 › Rechazar salto a RESUELTA», «Rechazar retroceso a REPORTADA», «Rechazar ASIGNADA por endpoint de estado», «Rechazar cambio desde estado final» (todos 409) y «Carlos avanza a EN_PROCESO», «Carlos resuelve» (200) | `junit.txt`; `newman/salida.txt` (carpeta 04); captura `04-tecnico-avanza.png` |
| 5 | Componentes (Seguridad); secuencia «estado» | **Autenticación JWT y autorización por rol**; solo el técnico asignado avanza (RNF1, RN5) | `filter/JwtAuthenticationFilter.java:40`; `config/SecurityConfig.java:66-69` (rol por ruta), la 72 (401 en JSON) y la 76 (filtro en la cadena); `IncidenciaService.java:125` (403 si no es el técnico asignado); `util/JwtUtil.java` | JUnit `soloElTecnicoAsignado`; Postman «06 › Sin token», «Token basura» y «Credenciales malas» (401); «04 › Rechazar técnico no asignado» y «Rechazar cambio por ana / elena» (403) | `newman/salida.txt` (carpetas 04 y 06); captura `01-login.png` |
| 6 | Clases; entidad-relación; secuencias | **Historial de estados** escrito en la misma transacción que el cambio y consultable como seguimiento (RN6, RF9, RNF2) | `model/HistorialEstadoModel.java`; escritura en `IncidenciaService.java:165`, llamada desde `registrar`, `asignar` y `cambiarEstado`, todos `@Transactional`; lectura en `IncidenciaService.java:96` ← `IncidenciaController.java:65` | Postman «05 › Historial completo visible para ana / elena / carlos»: exactamente 4 filas en orden, `estadoAnterior` encadenado y autores Ana, Elena, Carlos, Carlos | `newman/salida.txt` (carpeta 05); `bd-consultas.txt` (filas de historial por incidencia: 4 en las resueltas, 3 en proceso, 2 asignada, 1 reportada); captura `05-detalle-seguimiento.png` |
| 7 | Casos de uso | **Visibilidad por rol**: el usuario ve sus reportes, el técnico sus asignaciones y el coordinador todo (RN7, RF4, RF5) | Lista: `IncidenciaService.java:82` → `repository/IncidenciaRepository.java:27` (una sola consulta con filtros opcionales). Detalle e historial: `IncidenciaService.java:151` (`obtenerVisible`) | JUnit `usuarioNoVeAjenas`; Postman «02 › Listar ana / bruno / carlos / diana / elena», «Bruno no accede a detalle de Ana» (403); «03 › Diana no accede a detalle asignado a Carlos» (403) | `newman/salida.txt` (carpetas 02 y 03); capturas `02` (solo las de Ana) y `03` (todas) |
| 8 | Componentes (Frontend); despliegue | **Interfaz por actor** que cierra el flujo frontend–backend–datos | `frontend/src/app/core/auth.interceptor.ts:15` (agrega Bearer); `core/role.guard.ts:7`; `core/incidencia-api.service.ts:40-54`; componentes en `frontend/src/app/features/`: `LoginComponent`, `MisIncidenciasComponent`, `BandejaCoordinadorComponent`, `BandejaTecnicoComponent`, `DetalleIncidenciaComponent` | `scripts/capturas.mjs` recorre el flujo obligatorio en Chromium contra el backend real; `npx ng test` (5 pruebas del núcleo: sesión, interceptor, 401, guard, errores) | Capturas `01-login.png` a `05-detalle-seguimiento.png`; demostración en vivo |

## Cómo reproducir la cadena completa

```bash
podman compose up -d                         # PostgreSQL :5433 (o docker compose)
./backend/run.sh                             # Spring Boot :8081; Flyway crea el esquema y los usuarios
python3 scripts/sembrar-demo.py              # 4 incidencias de demostración en distintos estados
(cd frontend && npm ci && npx ng serve)      # Angular :4200
npx newman run postman/incidencias.postman_collection.json -e postman/local.postman_environment.json
(cd backend && ./mvnw test)
```

Usuarios de prueba (contraseña `Incidencias2026`): `ana` y `bruno` (usuario), `carlos` y `diana` (técnico), `elena` (coordinadora).

# Ejercicio 1 · Matriz inicial y plan tecnológico

## Plan tecnológico

| Capa | Tecnología | Uso en el prototipo |
|---|---|---|
| Frontend | Angular 22 (componentes standalone, signals, `HttpClient` con interceptor) | Login, vistas por rol y detalle con línea de tiempo. |
| Backend | Spring Boot 4.1 sobre Java 21 (Web MVC, Validation, Data JPA) | API REST `/api/v1` en capas controller / service / repository. |
| Seguridad | Spring Security con JWT (jjwt 0.12) y BCrypt | Autenticación sin estado y autorización por rol. |
| Datos | PostgreSQL 16 en contenedor; migraciones Flyway | Esquema versionado; Hibernate solo valida. |
| Documentación de la API | springdoc-openapi (Swagger UI) | Contrato navegable de los endpoints. |
| Pruebas | JUnit 5 + Mockito (servicio); Postman + newman (API) | Reglas de negocio y flujo completo verificables. |
| Modelado | PlantUML (fuentes en `docs/uml`, PNG en `docs/uml/png`) | Diagramas versionados junto con el código. |
| Versiones | Git + GitHub | Commits por fase como evidencia de evolución. |

## Matriz inicial

Cada fila es un elemento del modelo que **debe** aparecer en el prototipo. La columna de evidencia dice cómo se va a comprobar; en el Ejercicio 3 se completa con la prueba real y su resultado.

| # | Elemento modelado | Diagrama | Implementación prevista | Tecnología | Evidencia prevista |
|---|---|---|---|---|---|
| 1 | Entidad **Incidencia** con ubicación, categoría, descripción, prioridad, fecha y estado (RN1) | Clases, entidad-relación | `IncidenciaModel` + tabla `incidencia` en `V1__esquema_inicial.sql` | JPA, Flyway, PostgreSQL | Flyway aplica la migración; `ddl-auto: validate` arranca sin error; consulta SQL de la tabla. |
| 2 | **Registrar incidencia** con estado inicial Reportada (RF3, RN2) | Casos de uso, secuencia «registrar» | `POST /api/v1/incidencias` → `IncidenciaService.registrar()` | Spring MVC, Bean Validation | Postman: 201 con `estado = REPORTADA`; 400 si falta la descripción. |
| 3 | **Asignar técnico** solo por el coordinador y solo a un técnico (RF7, RN3) | Casos de uso, secuencia «estado», estados | `PATCH /api/v1/incidencias/{id}/asignacion` → `IncidenciaService.asignar()` | Spring MVC, JPA | Postman: 200 con `ASIGNADA`; 422 si el destino no es técnico; 409 si ya estaba asignada. |
| 4 | **Máquina de estados** Reportada → Asignada → En proceso → Resuelta (RN4) | Estados | `EstadoIncidencia.siguiente()` + validación en `IncidenciaService.cambiarEstado()` | Java enum | JUnit del servicio; Postman: 409 al saltar de Asignada a Resuelta. |
| 5 | **Control de acceso por rol** y solo el técnico asignado avanza (RNF1, RN5) | Componentes (Seguridad), secuencia «estado» | `SecurityConfig` + `JwtAuthenticationFilter` + verificación de dueño en el servicio | Spring Security, JWT | Postman: 401 sin token; 403 si un usuario intenta asignar; 403 si otro técnico cambia el estado. |
| 6 | **Historial de estados** (seguimiento) escrito en la misma transacción (RN6, RF9, RNF2) | Clases, entidad-relación, secuencias | `HistorialEstadoModel` + `GET /api/v1/incidencias/{id}/historial` | JPA, `@Transactional` | Postman: tras el flujo, el historial trae 4 filas en orden. |
| 7 | **Visibilidad por rol** de las consultas (RN7, RF4) | Casos de uso | `IncidenciaService.listar()` filtra por rol | Spring Data JPA | Postman: el usuario ve solo las suyas; el técnico solo las asignadas. |
| 8 | **Interfaz por actor** que cierra el flujo frontend–backend–datos | Componentes (Frontend), despliegue | Componentes Angular de login, bandejas y detalle; `authInterceptor` | Angular | Capturas de cada vista y demostración en vivo del flujo completo. |

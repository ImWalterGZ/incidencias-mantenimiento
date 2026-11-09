# Ejercicio 1 · Análisis del caso y alcance

**Caso 3. Sistema de control de incidencias de mantenimiento** · Equipo 3 · Arquitecturas de Software · 10 de noviembre de 2026

## 1. Situación

La universidad necesita registrar las fallas que aparecen en aulas, laboratorios y oficinas (una lámpara fundida, una fuga, un proyector que no enciende) y darles seguimiento desde que alguien las reporta hasta que un técnico las resuelve. Hoy el reporte es verbal o por mensaje: no queda registro de quién reportó, a quién se le asignó ni en qué estado va cada falla.

## 2. Actores

| Actor | Qué hace en el sistema |
|---|---|
| **Usuario** (estudiante, docente o personal) | Registra incidencias y consulta el estado y el seguimiento de las suyas. |
| **Coordinador** de mantenimiento | Ve todas las incidencias, asigna cada una a un técnico y supervisa su avance. |
| **Técnico** | Ve las incidencias que tiene asignadas, las atiende y actualiza su estado. |

## 3. Reglas de negocio

| ID | Regla | Cómo se garantiza |
|---|---|---|
| RN1 | Una incidencia incluye ubicación, categoría, descripción, prioridad, fecha y estado. | Columnas `NOT NULL` en la tabla y validación del DTO de entrada. |
| RN2 | Toda incidencia inicia como **Reportada**. | El servicio fija el estado al crearla; el cliente no puede enviarlo. |
| RN3 | Una incidencia puede asignarse a un técnico. | Solo el coordinador asigna, solo a un usuario con rol técnico y solo cuando la incidencia está en Reportada. No hay reasignación. |
| RN4 | Los estados siguen el orden **Reportada → Asignada → En proceso → Resuelta**, sin saltos ni retrocesos. | El enum `EstadoIncidencia` conoce el siguiente estado; cualquier otro cambio responde 409. |
| RN5 | Solo el técnico asignado mueve la incidencia de Asignada a En proceso y de En proceso a Resuelta. | El servicio compara el técnico asignado con el usuario autenticado; si no coincide responde 403. |
| RN6 | Cada cambio de estado queda en el historial con quién lo hizo, cuándo y un comentario opcional. | Tabla `historial_estado_incidencia`, escrita en la misma transacción que el cambio. |
| RN7 | Cada actor ve solo lo que le corresponde: el usuario sus reportes, el técnico sus asignaciones y el coordinador todo. | Filtro por rol en el servicio de consulta. |

## 4. Flujo funcional mínimo obligatorio

**Registrar incidencia → consultar → asignar técnico → actualizar estado → consultar seguimiento.**

1. El usuario inicia sesión y registra una incidencia eligiendo ubicación, categoría y prioridad. Queda en Reportada.
2. El usuario la ve en «mis incidencias» y el coordinador en su bandeja.
3. El coordinador elige un técnico. La incidencia pasa a Asignada.
4. El técnico la pasa a En proceso y después a Resuelta, con un comentario de lo que hizo.
5. El usuario abre el detalle y ve la línea de tiempo completa del historial.

## 5. Requerimientos

### Funcionales

| ID | Requerimiento | Actor |
|---|---|---|
| RF1 | Iniciar sesión y recibir un token con el rol del usuario. | Todos |
| RF2 | Consultar el catálogo de ubicaciones. | Usuario |
| RF3 | Registrar una incidencia. | Usuario |
| RF4 | Consultar incidencias según el rol, con filtro opcional por estado. | Todos |
| RF5 | Consultar el detalle de una incidencia. | Todos (con visibilidad por rol) |
| RF6 | Consultar la lista de técnicos. | Coordinador |
| RF7 | Asignar un técnico a una incidencia. | Coordinador |
| RF8 | Avanzar el estado de una incidencia asignada. | Técnico |
| RF9 | Consultar el historial (seguimiento) de una incidencia. | Todos (con visibilidad por rol) |

### No funcionales

| ID | Requerimiento | Decisión que lo atiende |
|---|---|---|
| RNF1 | **Seguridad:** autenticación y autorización por rol. | Spring Security con JWT sin estado; contraseñas con BCrypt. |
| RNF2 | **Integridad:** un cambio de estado y su registro en el historial ocurren juntos o no ocurren. | Métodos de servicio `@Transactional`. |
| RNF3 | **Trazabilidad del esquema:** la base de datos se crea y evoluciona con versiones. | Migraciones Flyway; Hibernate solo valida (`ddl-auto: validate`). |
| RNF4 | **Mantenibilidad:** separación clara de responsabilidades. | Capas controller / service / repository / model / dto, como en los proyectos de clase. |
| RNF5 | **Errores comprensibles:** el cliente recibe un mensaje y un código HTTP consistentes. | `BusinessException` con `ErrorMessageDto` y un `ExceptionHandler` global. |
| RNF6 | **Verificabilidad:** cada regla se puede comprobar desde fuera. | Colección de Postman ejecutada con newman y pruebas JUnit del servicio. |

## 6. Alcance

**Dentro:** los nueve requerimientos funcionales, las siete reglas, tres vistas Angular (usuario, coordinador y técnico) y el detalle con la línea de tiempo.

**Fuera, por no estar en el caso:** registro de cuentas (los usuarios se precargan), administración del catálogo de ubicaciones, reasignación, reapertura de incidencias resueltas, adjuntos o fotos, notificaciones y reportes estadísticos.

## 7. Arquitectura seleccionada

**Cliente-servidor con un backend monolítico organizado en capas.**

- **Cliente:** SPA en Angular que consume la API REST con el token JWT.
- **Servidor:** una sola aplicación Spring Boot con capas controller → service → repository, más una capa transversal de seguridad (filtro JWT y configuración de Spring Security).
- **Datos:** PostgreSQL, con el esquema versionado por Flyway.

**Por qué esta y no otra:**

- **Microservicios** (por ejemplo, un servicio de autenticación y otro de incidencias comunicados por eventos) resuelven problemas de escala y de equipos independientes que este caso no tiene. Con un solo dominio y cuatro tablas, solo añaden despliegue, red y consistencia eventual que complican la demostración.
- **Hexagonal** daría independencia de la base de datos y del framework, pero agrega puertos y adaptadores que no se aprovechan en un prototipo y alargan el camino de diagrama a código en la matriz.
- **Capas** es la estructura de los proyectos de clase, hace que cada elemento del diagrama de componentes corresponda a un paquete concreto y concentra las reglas en un solo servicio, que es justo lo que se va a probar.

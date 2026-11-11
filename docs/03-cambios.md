# Ejercicio 3 · Diferencias entre el modelo y la implementación

Al construir el prototipo aparecieron diferencias con los diagramas del Ejercicio 1. Algunas se resolvieron **actualizando el diagrama**, porque la implementación era la correcta. Otras son **decisiones de detalle** que el diagrama no tenía por qué mostrar y se dejan documentadas aquí. Ninguna cambia la arquitectura, el flujo obligatorio ni las reglas del caso.

| # | Diferencia | Dónde se ve | Justificación | Acción |
|---|---|---|---|---|
| 1 | La base de datos impone que una incidencia en Reportada no tenga técnico y que en cualquier otro estado sí lo tenga (restricción `incidencia_tecnico_segun_estado`). | `V1__esquema_inicial.sql` | La regla de asignación (RN3) ya la cumplía el servicio, pero si solo vive en el código, un `UPDATE` manual puede romperla. Con la restricción, la base la garantiza aunque se salte la API. | Diagrama entidad-relación actualizado con una nota. |
| 2 | Aparece `UserDetailsServiceImpl`, que carga al usuario por su username tanto en el login como en el filtro JWT. | `service/UserDetailsServiceImpl.java` | Spring Security necesita este componente para validar contraseñas y reconstruir al usuario del token. En el primer diagrama se había dado por implícito. | Diagrama de componentes actualizado. |
| 3 | El frontend tiene un `roleGuard` que impide entrar a vistas de otro rol, por ejemplo un usuario abriendo `/coordinacion`. | `frontend/src/app/core/role.guard.ts` | Es solo experiencia de usuario. La protección real sigue en el backend (403), así que el guard no sustituye a la seguridad del servidor. | Diagrama de componentes actualizado. |
| 4 | Se quitó el bean `AuthenticationProvider` que traía el proyecto de referencia (`login-service`). | `config/SecurityConfig.java` | Spring Security 7 arma el mismo proveedor a partir de `UserDetailsService` y `PasswordEncoder`, y con el bean explícito emitía una advertencia. El comportamiento no cambia. | Solo se documenta. |
| 5 | Si el coordinador no escribe comentario al asignar, el historial guarda «Asignada a {técnico}». | `IncidenciaService.asignar()` | El seguimiento debe decir a quién se asignó. El técnico actual vive en la incidencia, pero el historial es la bitácora que lee el usuario. | Solo se documenta (las secuencias no bajan a ese nivel). |
| 6 | La descripción exige entre 10 y 1000 caracteres. | `IncidenciaRequestDto` | El caso solo pide que la descripción exista. El mínimo evita reportes vacíos de contenido, como «no sirve». | Documentado en el análisis (RN1). |
| 7 | Un valor de enum desconocido (por ejemplo `"categoria": "XX"`) o un JSON mal formado responden 400, igual que un campo faltante. | `exception/ExceptionHandler.java` | Para quien consume la API, las dos son entradas inválidas; un 500 confundiría. | Solo se documenta. |
| 8 | Las fechas se guardan y se devuelven en UTC con precisión de microsegundos, y el frontend las muestra en hora local de México. | `util/DatetimeUtil.java` | Sin este ajuste, la respuesta del POST traía la hora local con nanosegundos y la del GET la traía en UTC con microsegundos, así que la misma incidencia parecía tener dos fechas. | Solo se documenta. |
| 9 | Los puertos son 8081 para el backend y 5433 para Postgres, en lugar de los habituales 8080 y 5432. | `application.yaml`, `compose.yaml` | En el equipo de desarrollo los puertos por defecto ya estaban ocupados por otros servicios. | Diagrama de despliegue (ya los usaba). |

## Diagramas sin cambios

Casos de uso, clases, estados y las dos secuencias corresponden a la implementación tal como se modelaron. Los nombres de clases, métodos, endpoints y códigos HTTP que aparecen en ellos existen en el código; la matriz final (`04-matriz-final.md`) da la línea exacta de cada uno.

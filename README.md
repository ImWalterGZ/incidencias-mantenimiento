# Control de incidencias de mantenimiento

Prototipo funcional mínimo del **Caso 3** de la Evidencia 6 de Arquitecturas de Software (UTCH, IDGS71N, Equipo 3). Un usuario reporta una falla en un aula, laboratorio u oficina; la coordinación la asigna a un técnico; el técnico la atiende y la resuelve; y cualquiera de ellos consulta el seguimiento.

**Flujo obligatorio:** registrar incidencia → consultar → asignar técnico → actualizar estado → consultar seguimiento.

## Arquitectura

Cliente-servidor: una SPA en **Angular** consume una API REST de un monolito **Spring Boot** organizado en capas (controller → service → repository) con **Spring Security + JWT**. Los datos viven en **PostgreSQL**, con el esquema versionado por **Flyway**.

| Carpeta | Contenido |
|---|---|
| `backend/` | API Spring Boot 4.1 / Java 21 (puerto 8081) |
| `frontend/` | SPA Angular 22 (puerto 4200) |
| `postman/` | Colección y entorno; se ejecuta con newman |
| `docs/` | Análisis, matrices, cambios, diagramas (`docs/uml`, PlantUML + PNG) y evidencias |
| `scripts/` | Datos de demostración, capturas automáticas y `evidencias.sh`, que regenera todas las evidencias |

## Documentos

1. [Análisis del caso y alcance](docs/01-analisis.md): actores, reglas, requerimientos y justificación de la arquitectura.
2. [Matriz inicial y plan tecnológico](docs/02-matriz-inicial.md)
3. [Diferencias entre modelo e implementación](docs/03-cambios.md)
4. [Matriz final de correspondencia](docs/04-matriz-final.md): diagrama → elemento → implementación (archivo y línea) → prueba → evidencia.

## Ejecutar

Requisitos: JDK 21, Node 22 o posterior, y podman o docker.

```bash
podman compose up -d                    # PostgreSQL en :5433
./backend/run.sh                        # API en http://localhost:8081 (Swagger en /swagger-ui.html)
python3 scripts/sembrar-demo.py         # opcional: incidencias de demostración
cd frontend && npm ci && npx ng serve   # http://localhost:4200
```

Usuarios de prueba (contraseña `Incidencias2026`):

| Usuario | Rol | Vista |
|---|---|---|
| `ana`, `bruno` | Usuario | Reportar y mis incidencias |
| `elena` | Coordinadora | Bandeja de coordinación |
| `carlos`, `diana` | Técnico | Mis asignaciones |

## Pruebas

```bash
(cd backend && ./mvnw test)                                                   # 11 unitarias + 2 de integración (requiere la base)
npx newman run postman/incidencias.postman_collection.json -e postman/local.postman_environment.json   # 65 requests, 162 assertions
(cd frontend && npx ng test --watch=false)                                    # 5 pruebas del núcleo
```

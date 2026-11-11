# Frontend: control de incidencias de mantenimiento

Angular 22 (componentes standalone, signals, sin librerías de UI). Consume el backend Spring Boot en `http://localhost:8081/api/v1` (configurable en `src/environments/environment.ts`).

## Cómo correrlo

```bash
npm install
npx ng serve --port 4200   # http://localhost:4200 (el CORS del backend solo permite este origen)
npx ng build               # compilación de producción en dist/
npx ng test --watch=false  # pruebas unitarias (Vitest + jsdom, no requiere navegador)
```

El backend debe estar levantado antes de iniciar sesión. Usuarios de prueba (contraseña `Incidencias2026`): `ana` y `bruno` (Usuario), `carlos` y `diana` (Técnico), `elena` (Coordinador). La pantalla de login tiene botones que rellenan el formulario.

## Vistas por rol

| Ruta | Componente | Rol | Qué hace |
|---|---|---|---|
| `/login` | `LoginComponent` | público | Inicio de sesión y ayuda con usuarios de prueba |
| `/mis-incidencias` | `MisIncidenciasComponent` | USUARIO | Reportar una incidencia y ver las propias |
| `/coordinacion` | `BandejaCoordinadorComponent` | COORDINADOR | Ver todas, filtrar por estado y asignar técnico |
| `/tecnico` | `BandejaTecnicoComponent` | TECNICO | Ver asignaciones y avanzar el estado con comentario opcional |
| `/incidencias/:id` | `DetalleIncidenciaComponent` | cualquiera con sesión | Datos completos y línea de tiempo del historial |

Tras el login cada rol es redirigido a su pantalla; una ruta ajena al rol redirige a la propia. Un 401 del backend cierra la sesión.

## Estructura de `src/app`

- `core/auth.service.ts`, `core/auth.interceptor.ts`, `core/role.guard.ts`: sesión (localStorage), cabecera `Authorization: Bearer` y guardas por rol.
- `core/incidencia-api.service.ts`: llamadas a incidencias, ubicaciones y usuarios.
- `core/models.ts`: tipos, etiquetas en español y lectura de errores del backend.
- `features/*`: los cinco componentes de arriba.

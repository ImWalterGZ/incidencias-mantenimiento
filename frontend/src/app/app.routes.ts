import { Routes } from '@angular/router';
import { inicioGuard, roleGuard } from './core/role.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', canActivate: [inicioGuard], children: [] },
  {
    path: 'login',
    title: 'Iniciar sesión',
    loadComponent: () => import('./features/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'mis-incidencias',
    title: 'Mis incidencias',
    canActivate: [roleGuard('USUARIO')],
    loadComponent: () =>
      import('./features/mis-incidencias/mis-incidencias.component').then(
        (m) => m.MisIncidenciasComponent,
      ),
  },
  {
    path: 'coordinacion',
    title: 'Bandeja de coordinación',
    canActivate: [roleGuard('COORDINADOR')],
    loadComponent: () =>
      import('./features/bandeja-coordinador/bandeja-coordinador.component').then(
        (m) => m.BandejaCoordinadorComponent,
      ),
  },
  {
    path: 'tecnico',
    title: 'Mis asignaciones',
    canActivate: [roleGuard('TECNICO')],
    loadComponent: () =>
      import('./features/bandeja-tecnico/bandeja-tecnico.component').then(
        (m) => m.BandejaTecnicoComponent,
      ),
  },
  {
    path: 'incidencias/:id',
    title: 'Seguimiento de incidencia',
    canActivate: [roleGuard()],
    loadComponent: () =>
      import('./features/detalle-incidencia/detalle-incidencia.component').then(
        (m) => m.DetalleIncidenciaComponent,
      ),
  },
  { path: '**', redirectTo: '' },
];

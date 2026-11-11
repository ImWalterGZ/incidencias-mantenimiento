import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Rol } from './models';

/** Permite el paso solo a los roles indicados; sin roles, a cualquier usuario con sesión. */
export const roleGuard =
  (...roles: Rol[]): CanActivateFn =>
  () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (!auth.usuario()) {
      return router.createUrlTree(['/login']);
    }
    return auth.tieneRol(...roles) ? true : router.parseUrl(auth.rutaInicio());
  };

/** Envía a cada quien a su pantalla de inicio (o al login si no hay sesión). */
export const inicioGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return inject(Router).parseUrl(auth.rutaInicio());
};

import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';
import { ROL_LABEL } from './core/models';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  template: `
    <header class="topbar">
      <div class="topbar__inner">
        <a class="marca" [routerLink]="auth.rutaInicio()">
          <span class="marca__sello">UT</span>
          <span class="marca__texto">Control de incidencias <small>Mantenimiento</small></span>
        </a>
        @if (auth.usuario(); as u) {
          <div class="sesion">
            <div class="sesion__datos">
              <strong>{{ u.nombre }}</strong>
              <span class="chip chip--rol">{{ rolLabel[u.rol] }}</span>
            </div>
            <button type="button" class="btn btn--secundario btn--chico" (click)="auth.logout()">
              Cerrar sesión
            </button>
          </div>
        }
      </div>
    </header>
    <main class="contenedor">
      <router-outlet />
    </main>
  `,
})
export class App {
  protected readonly auth = inject(AuthService);
  protected readonly rolLabel = ROL_LABEL;
}

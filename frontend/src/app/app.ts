import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';
import { ROL_LABEL } from './core/models';
import { SECCION_ROL, iniciales } from './shared/util';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="shell" [class.shell--sesion]="auth.usuario()">
      @if (auth.usuario(); as u) {
        <aside class="lateral">
          <a class="marca" [routerLink]="auth.rutaInicio()" aria-label="Mantenimiento UTCH, ir al inicio">
            <svg class="isotipo" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <rect width="24" height="24" rx="6" fill="#ff0034" />
              <circle cx="12" cy="12" r="6" fill="none" stroke="#fff" stroke-width="1.75" />
              <path d="M12 12V7.5A4.5 4.5 0 0 1 12 16.5Z" fill="#fff" />
            </svg>
            <span class="marca__nombre">Mantenimiento <span class="marca__punto">·</span> UTCH</span>
          </a>

          <nav class="lateral__nav" aria-label="Principal">
            <p class="lateral__rotulo">Bandeja</p>
            <a class="nav-item" [routerLink]="auth.rutaInicio()" routerLinkActive="nav-item--activo" ariaCurrentWhenActive="page">
              <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M2.5 9.5h3l1 2h3l1-2h3" />
                <path d="M2.5 9.5 4 3.5h8l1.5 6v3h-11Z" />
              </svg>
              {{ seccion() }}
            </a>
          </nav>

          <div class="lateral__usuario">
            <span class="avatar avatar--md" aria-hidden="true">{{ iniciales(u.nombre) }}</span>
            <div class="lateral__datos">
              <strong>{{ u.nombre }}</strong>
              <span>{{ rolLabel[u.rol] }}</span>
            </div>
            <button type="button" class="btn-ghost" (click)="auth.logout()">
              <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M6.5 2.5h-3v11h3M10 5.5 12.5 8 10 10.5M12.5 8H6" />
              </svg>
              Cerrar sesión
            </button>
          </div>
        </aside>
      }
      <main class="contenido">
        <router-outlet />
      </main>
    </div>
  `,
})
export class App {
  protected readonly auth = inject(AuthService);
  protected readonly rolLabel = ROL_LABEL;
  protected readonly iniciales = iniciales;
  protected readonly seccion = computed(() => {
    const u = this.auth.usuario();
    return u ? SECCION_ROL[u.rol] : '';
  });
}

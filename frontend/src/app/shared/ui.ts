import { Component, computed, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ESTADO_LABEL, Estado, PRIORIDAD_LABEL, Prioridad } from '../core/models';
import { iniciales } from './util';

/** Círculo de progreso del estado: vacío, un cuarto, mitad, check. */
@Component({
  selector: 'app-estado-icono',
  template: `
    <svg
      class="ico ico-estado estado-{{ estado() }}"
      viewBox="0 0 16 16"
      [attr.width]="tamano()"
      [attr.height]="tamano()"
      fill="none"
      [attr.role]="decorativo() ? null : 'img'"
      [attr.aria-label]="decorativo() ? null : etiqueta()"
      [attr.aria-hidden]="decorativo() ? 'true' : null"
    >
      @switch (estado()) {
        @case ('REPORTADA') {
          <circle cx="8" cy="8" r="6.25" stroke="currentColor" stroke-width="1.5" />
        }
        @case ('ASIGNADA') {
          <circle cx="8" cy="8" r="6.25" stroke="currentColor" stroke-width="1.5" />
          <path d="M8 8V3.75A4.25 4.25 0 0 1 12.25 8Z" fill="currentColor" />
        }
        @case ('EN_PROCESO') {
          <circle cx="8" cy="8" r="6.25" stroke="currentColor" stroke-width="1.5" />
          <path d="M8 3.75A4.25 4.25 0 0 1 8 12.25Z" fill="currentColor" />
        }
        @case ('RESUELTA') {
          <circle cx="8" cy="8" r="7" fill="currentColor" />
          <path d="M5.1 8.2l2 2 3.8-4.1" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        }
      }
    </svg>
  `,
})
export class EstadoIcono {
  readonly estado = input.required<Estado>();
  readonly tamano = input(16);
  readonly decorativo = input(false);
  protected readonly etiqueta = computed(() => 'Estado: ' + ESTADO_LABEL[this.estado()]);
}

/** Prioridad como barras de señal: una (baja), dos (media) o tres (alta). */
@Component({
  selector: 'app-prioridad-icono',
  template: `
    <svg
      class="ico ico-prio prio-{{ prioridad() }}"
      viewBox="0 0 16 16"
      width="16"
      height="16"
      role="img"
      [attr.aria-label]="'Prioridad ' + etiqueta()"
    >
      <rect x="2.25" y="9.5" width="3" height="4.5" rx=".8" [class.apagada]="nivel() < 1" />
      <rect x="6.5" y="6.25" width="3" height="7.75" rx=".8" [class.apagada]="nivel() < 2" />
      <rect x="10.75" y="2.5" width="3" height="11.5" rx=".8" [class.apagada]="nivel() < 3" />
    </svg>
  `,
})
export class PrioridadIcono {
  readonly prioridad = input.required<Prioridad>();
  protected readonly etiqueta = computed(() => PRIORIDAD_LABEL[this.prioridad()].toLowerCase());
  protected readonly nivel = computed(() => ({ BAJA: 1, MEDIA: 2, ALTA: 3 })[this.prioridad()]);
}

/** Avatar de iniciales; sin nombre se muestra el círculo punteado de «sin asignar». */
@Component({
  selector: 'app-avatar',
  template: `
    @if (nombre(); as n) {
      <span class="avatar avatar--{{ tamano() }}" [attr.title]="etiqueta()" role="img" [attr.aria-label]="etiqueta()">{{ ini() }}</span>
    } @else {
      <span class="avatar avatar--vacio avatar--{{ tamano() }}" [attr.title]="'Técnico: sin asignar'" role="img" aria-label="Técnico: sin asignar">
        <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
          <circle cx="8" cy="6" r="2.25" />
          <path d="M3.5 13c.7-2.1 2.4-3.2 4.5-3.2s3.8 1.1 4.5 3.2" />
        </svg>
      </span>
    }
  `,
})
export class Avatar {
  readonly nombre = input<string | null | undefined>(null);
  readonly tamano = input<'sm' | 'md'>('sm');
  /** Prefijo del tooltip y de la etiqueta accesible, p. ej. «Técnico». */
  readonly rotulo = input('');
  protected readonly etiqueta = computed(() => (this.rotulo() ? `${this.rotulo()}: ` : '') + (this.nombre() ?? ''));
  protected readonly ini = computed(() => iniciales(this.nombre() ?? ''));
}

/** Encabezado delgado con breadcrumb a la izquierda y acciones (contenido proyectado) a la derecha. */
@Component({
  selector: 'app-cabecera',
  imports: [RouterLink],
  template: `
    <header class="cabecera">
      <nav class="migas" aria-label="Ruta de navegación">
        @if (ruta(); as r) {
          <a class="migas__seccion" [routerLink]="r">{{ seccion() }}</a>
        } @else {
          <span class="migas__seccion">{{ seccion() }}</span>
        }
        <svg class="migas__sep" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M6 3.5 10.5 8 6 12.5" />
        </svg>
        <h1 class="migas__actual">{{ actual() }}</h1>
      </nav>
      <div class="cabecera__acciones"><ng-content /></div>
    </header>
  `,
})
export class Cabecera {
  readonly seccion = input.required<string>();
  readonly actual = input.required<string>();
  readonly ruta = input<string | null>(null);
}

/** Grupo plegable de una lista: ícono de estado, nombre y conteo. Las filas se proyectan dentro. */
@Component({
  selector: 'app-grupo-estado',
  imports: [EstadoIcono],
  template: `
    <section class="grupo">
      <h2 class="grupo__titulo">
        <button type="button" class="grupo__boton" [attr.aria-expanded]="!colapsado()" (click)="colapsado.set(!colapsado())">
          <svg class="grupo__chevron" [class.grupo__chevron--cerrado]="colapsado()" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M4 6l4 4 4-4" />
          </svg>
          <app-estado-icono [estado]="estado()" [decorativo]="true" />
          <span class="grupo__nombre">{{ nombre() }}</span>
          <span class="grupo__conteo">{{ total() }}</span>
        </button>
      </h2>
      <div class="grupo__filas" [hidden]="colapsado()"><ng-content /></div>
    </section>
  `,
})
export class GrupoEstadoComponent {
  readonly estado = input.required<Estado>();
  readonly total = input.required<number>();
  protected readonly colapsado = signal(false);
  protected readonly nombre = computed(() => ESTADO_LABEL[this.estado()]);
}

/** Aviso flotante (confirmaciones y errores de acciones). El texto va directo en un <p>. */
@Component({
  selector: 'app-toast',
  template: `
    <div class="toast-zona" aria-live="polite">
      @if (mensaje(); as m) {
        <div class="toast" [class.toast--error]="tipo() === 'error'" [attr.role]="tipo() === 'error' ? 'alert' : null">
          <p>{{ m }}</p>
          <button type="button" class="toast__cerrar" aria-label="Cerrar aviso" (click)="cerrar.emit()">
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>
      }
    </div>
  `,
})
export class Toast {
  readonly mensaje = input<string | null>(null);
  readonly tipo = input<'ok' | 'error'>('ok');
  readonly cerrar = output<void>();
}

import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IncidenciaApiService } from '../../core/incidencia-api.service';
import { Avatar, Cabecera, EstadoIcono, GrupoEstadoComponent, PrioridadIcono, Toast } from '../../shared/ui';
import { agruparPorEstado, fechaCorta, fechaLarga, folio } from '../../shared/util';
import {
  CATEGORIA_LABEL,
  ESTADO_LABEL,
  Estado,
  Incidencia,
  leerError,
} from '../../core/models';

const SIGUIENTE: Partial<Record<Estado, { estado: Estado; boton: string }>> = {
  ASIGNADA: { estado: 'EN_PROCESO', boton: 'Iniciar atención' },
  EN_PROCESO: { estado: 'RESUELTA', boton: 'Marcar como resuelta' },
};

@Component({
  selector: 'app-bandeja-tecnico',
  imports: [RouterLink, Cabecera, GrupoEstadoComponent, EstadoIcono, PrioridadIcono, Avatar, Toast],
  template: `
    <app-cabecera seccion="Mis asignaciones" actual="Asignadas a mí">
      <span class="cabecera__conteo">{{ pendientes() }} pendiente(s) · {{ incidencias().length }} en total</span>
    </app-cabecera>

    @if (error()) {
      <div class="aviso aviso--error aviso--pagina" role="alert">{{ error() }}</div>
    }

    @if (cargando()) {
      <p class="cargando">Cargando…</p>
    } @else if (incidencias().length === 0) {
      <div class="vacio">
        <p class="vacio__titulo">No tienes incidencias asignadas</p>
        <p>Cuando coordinación te asigne una, aparecerá aquí para que avances su estado.</p>
      </div>
    } @else {
      @for (g of grupos(); track g.estado) {
        <app-grupo-estado [estado]="g.estado" [total]="g.items.length">
          @for (i of g.items; track i.id) {
            <article class="fila fila--accion">
              <app-prioridad-icono [prioridad]="i.prioridad" />
              <span class="fila__id mono" aria-hidden="true">{{ folio(i.id) }}</span>
              <app-estado-icono [estado]="i.estado" />
              <a class="fila__titulo" [routerLink]="['/incidencias', i.id]">
                <span class="sr-only">Ver seguimiento de la incidencia #{{ i.id }}. </span>{{ i.descripcion }}
              </a>
              <span class="fila__chips">
                <span class="chip">{{ i.ubicacion.nombre }}</span>
                <span class="chip">{{ categoriaLabel[i.categoria] }}</span>
              </span>
              <app-avatar [nombre]="i.reportante.nombre" rotulo="Reportó" />
              <time class="fila__fecha" [attr.datetime]="i.fechaReporte" [attr.title]="fechaLarga(i.fechaReporte)">{{ fechaCorta(i.fechaReporte) }}</time>
              @if (siguiente[i.estado]; as sig) {
                <div class="fila__accion">
                  <input type="text" maxlength="500" placeholder="Comentario (opcional)"
                    [attr.aria-label]="'Comentario para la incidencia ' + i.id"
                    [value]="comentarios()[i.id] ?? ''"
                    (input)="comentar(i.id, $any($event.target).value)" />
                  <button type="button" class="btn btn--chico" [disabled]="avanzando() === i.id" (click)="avanzar(i, sig.estado)">
                    {{ avanzando() === i.id ? 'Guardando…' : sig.boton }}
                  </button>
                </div>
              }
              @if (errorFila()[i.id]; as e) { <span class="fila__error error-campo" role="alert">{{ e }}</span> }
            </article>
          }
        </app-grupo-estado>
      }
    }

    <app-toast [mensaje]="exito()" (cerrar)="exito.set(null)" />
  `,
})
export class BandejaTecnicoComponent {
  private readonly api = inject(IncidenciaApiService);

  protected readonly categoriaLabel = CATEGORIA_LABEL;
  protected readonly folio = folio;
  protected readonly fechaCorta = fechaCorta;
  protected readonly fechaLarga = fechaLarga;
  protected readonly siguiente = SIGUIENTE;

  protected readonly incidencias = signal<Incidencia[]>([]);
  protected readonly grupos = computed(() => agruparPorEstado(this.incidencias()));
  protected readonly pendientes = computed(() => this.incidencias().filter((i) => i.estado !== 'RESUELTA').length);
  protected readonly comentarios = signal<Record<number, string>>({});
  protected readonly errorFila = signal<Record<number, string>>({});
  protected readonly avanzando = signal<number | null>(null);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly exito = signal<string | null>(null);

  constructor() {
    this.api.listarIncidencias().subscribe({
      next: (lista) => {
        this.incidencias.set(this.ordenar(lista));
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(leerError(e).message);
        this.cargando.set(false);
      },
    });
  }

  protected comentar(id: number, texto: string): void {
    this.comentarios.update((c) => ({ ...c, [id]: texto }));
  }

  protected avanzar(i: Incidencia, estado: Estado): void {
    this.avanzando.set(i.id);
    this.exito.set(null);
    this.errorFila.update((m) => ({ ...m, [i.id]: '' }));
    this.api.cambiarEstado(i.id, estado, this.comentarios()[i.id]?.trim()).subscribe({
      next: (actualizada) => {
        this.avanzando.set(null);
        this.exito.set(`Incidencia #${actualizada.id} ahora está «${ESTADO_LABEL[actualizada.estado]}».`);
        this.incidencias.update((lista) =>
          this.ordenar(lista.map((x) => (x.id === actualizada.id ? actualizada : x))),
        );
        this.comentarios.update((c) => ({ ...c, [i.id]: '' }));
      },
      error: (err) => {
        this.avanzando.set(null);
        this.errorFila.update((m) => ({ ...m, [i.id]: leerError(err).message }));
      },
    });
  }

  /** Pendientes primero (las resueltas al final), luego por folio descendente. */
  private ordenar(lista: Incidencia[]): Incidencia[] {
    const peso = (i: Incidencia) => (i.estado === 'RESUELTA' ? 1 : 0);
    return [...lista].sort((a, b) => peso(a) - peso(b) || b.id - a.id);
  }
}

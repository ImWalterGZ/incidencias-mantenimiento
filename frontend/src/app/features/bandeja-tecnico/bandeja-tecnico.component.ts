import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IncidenciaApiService } from '../../core/incidencia-api.service';
import {
  CATEGORIA_LABEL,
  ESTADO_LABEL,
  Estado,
  Incidencia,
  PRIORIDAD_LABEL,
  leerError,
} from '../../core/models';

const SIGUIENTE: Partial<Record<Estado, { estado: Estado; boton: string }>> = {
  ASIGNADA: { estado: 'EN_PROCESO', boton: 'Iniciar atención' },
  EN_PROCESO: { estado: 'RESUELTA', boton: 'Marcar como resuelta' },
};

@Component({
  selector: 'app-bandeja-tecnico',
  imports: [RouterLink, DatePipe],
  template: `
    <div class="encabezado">
      <div>
        <h1>Mis asignaciones</h1>
        <p>Incidencias que te asignó coordinación. Avanza su estado conforme las atiendes.</p>
      </div>
    </div>

    @if (exito()) {
      <div class="aviso aviso--ok" role="status">{{ exito() }}</div>
    }
    @if (error()) {
      <div class="aviso aviso--error" role="alert">{{ error() }}</div>
    }

    @if (cargando()) {
      <p class="cargando">Cargando…</p>
    } @else if (incidencias().length === 0) {
      <p class="tarjeta vacio">No tienes incidencias asignadas.</p>
    } @else {
      <div class="lista-tarjetas">
        @for (i of incidencias(); track i.id) {
          <article class="item">
            <div class="item__cabecera">
              <strong>#{{ i.id }} · {{ categoriaLabel[i.categoria] }}</strong>
              <div class="item__chips">
                <span class="chip prio-{{ i.prioridad }}">Prioridad {{ prioridadLabel[i.prioridad].toLowerCase() }}</span>
                <span class="chip estado-{{ i.estado }}">{{ estadoLabel[i.estado] }}</span>
              </div>
            </div>
            <p>{{ i.descripcion }}</p>
            <span class="secundario">
              {{ i.ubicacion.edificio }} · {{ i.ubicacion.nombre }} · Reportó {{ i.reportante.nombre }} · {{ i.fechaReporte | date: 'd MMM y, h:mm a' }}
            </span>
            <div class="item__pie">
              @if (siguiente[i.estado]; as sig) {
                <div class="filtro" style="flex: 1; min-width: 260px">
                  <input type="text" maxlength="500" placeholder="Comentario (opcional)"
                    [attr.aria-label]="'Comentario para la incidencia ' + i.id"
                    [value]="comentarios()[i.id] ?? ''"
                    (input)="comentar(i.id, $any($event.target).value)" />
                  <button type="button" class="btn btn--chico" style="white-space: nowrap"
                    [disabled]="avanzando() === i.id" (click)="avanzar(i, sig.estado)">
                    {{ avanzando() === i.id ? 'Guardando…' : sig.boton }}
                  </button>
                </div>
              } @else {
                <span class="secundario">Incidencia resuelta, sin acciones pendientes.</span>
              }
              <a class="btn btn--secundario btn--chico" [routerLink]="['/incidencias', i.id]" style="text-decoration: none">Ver seguimiento</a>
            </div>
            @if (errorFila()[i.id]; as e) { <span class="error-campo">{{ e }}</span> }
          </article>
        }
      </div>
    }
  `,
})
export class BandejaTecnicoComponent {
  private readonly api = inject(IncidenciaApiService);

  protected readonly estadoLabel = ESTADO_LABEL;
  protected readonly categoriaLabel = CATEGORIA_LABEL;
  protected readonly prioridadLabel = PRIORIDAD_LABEL;
  protected readonly siguiente = SIGUIENTE;

  protected readonly incidencias = signal<Incidencia[]>([]);
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

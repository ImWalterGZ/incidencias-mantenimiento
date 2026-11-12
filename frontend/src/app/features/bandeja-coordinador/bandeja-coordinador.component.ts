import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IncidenciaApiService } from '../../core/incidencia-api.service';
import { Avatar, Cabecera, EstadoIcono, GrupoEstadoComponent, PrioridadIcono, Toast } from '../../shared/ui';
import { agruparPorEstado, fechaCorta, fechaLarga, folio } from '../../shared/util';
import {
  CATEGORIA_LABEL,
  ESTADOS,
  ESTADO_LABEL,
  Estado,
  Incidencia,
  Usuario,
  leerError,
} from '../../core/models';

@Component({
  selector: 'app-bandeja-coordinador',
  imports: [RouterLink, Cabecera, GrupoEstadoComponent, EstadoIcono, PrioridadIcono, Avatar, Toast],
  template: `
    <app-cabecera seccion="Coordinación" actual="Todas las incidencias">
      <span class="cabecera__conteo">{{ incidencias().length }} incidencia(s)</span>
      <label for="filtro" class="sr-only">Filtrar por estado</label>
      <select id="filtro" class="select-chico" (change)="filtrar($any($event.target).value)">
        <option value="">Todos los estados</option>
        @for (e of estados; track e) {
          <option [value]="e">{{ estadoLabel[e] }}</option>
        }
      </select>
    </app-cabecera>

    @if (error()) {
      <div class="aviso aviso--error aviso--pagina" role="alert">{{ error() }}</div>
    }

    @if (cargando()) {
      <p class="cargando">Cargando…</p>
    } @else if (incidencias().length === 0) {
      <div class="vacio">
        <p class="vacio__titulo">No hay incidencias con este filtro</p>
        <p>Prueba con otro estado o elige «Todos los estados».</p>
      </div>
    } @else {
      @for (g of grupos(); track g.estado) {
        <app-grupo-estado [estado]="g.estado" [total]="g.items.length">
          @for (i of g.items; track i.id) {
            <article class="fila">
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
              @if (i.estado === 'REPORTADA') {
                <span class="fila__asignar">
                  <select class="select-chico" [attr.aria-label]="'Técnico para la incidencia ' + i.id" (change)="elegir(i.id, $any($event.target).value)">
                    <option value="">Asignar a…</option>
                    @for (t of tecnicos(); track t.id) {
                      <option [value]="t.id">{{ t.nombre }}</option>
                    }
                  </select>
                  <button type="button" class="btn btn--chico" [disabled]="!seleccion()[i.id] || asignando() === i.id" (click)="asignar(i)">
                    {{ asignando() === i.id ? 'Asignando…' : 'Asignar' }}
                  </button>
                </span>
              } @else {
                <app-avatar [nombre]="i.tecnico?.nombre" rotulo="Técnico" />
              }
              <time class="fila__fecha" [attr.datetime]="i.fechaReporte" [attr.title]="fechaLarga(i.fechaReporte)">{{ fechaCorta(i.fechaReporte) }}</time>
              @if (errorFila()[i.id]; as e) { <span class="fila__error error-campo" role="alert">{{ e }}</span> }
            </article>
          }
        </app-grupo-estado>
      }
    }

    <app-toast [mensaje]="exito()" (cerrar)="exito.set(null)" />
  `,
})
export class BandejaCoordinadorComponent {
  private readonly api = inject(IncidenciaApiService);

  protected readonly estados = ESTADOS;
  protected readonly estadoLabel = ESTADO_LABEL;
  protected readonly categoriaLabel = CATEGORIA_LABEL;
  protected readonly folio = folio;
  protected readonly fechaCorta = fechaCorta;
  protected readonly fechaLarga = fechaLarga;

  protected readonly incidencias = signal<Incidencia[]>([]);
  protected readonly grupos = computed(() => agruparPorEstado(this.incidencias()));
  protected readonly tecnicos = signal<Usuario[]>([]);
  protected readonly seleccion = signal<Record<number, number>>({});
  protected readonly errorFila = signal<Record<number, string>>({});
  protected readonly asignando = signal<number | null>(null);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly exito = signal<string | null>(null);
  private filtroActual: Estado | '' = '';

  constructor() {
    this.api.listarTecnicos().subscribe({
      next: (t) => this.tecnicos.set(t),
      error: (e) => this.error.set(leerError(e).message),
    });
    this.cargar();
  }

  protected filtrar(valor: Estado | ''): void {
    this.filtroActual = valor;
    this.cargando.set(true);
    this.cargar();
  }

  protected elegir(incidenciaId: number, tecnicoId: string): void {
    this.seleccion.update((s) => ({ ...s, [incidenciaId]: Number(tecnicoId) }));
  }

  protected asignar(i: Incidencia): void {
    const tecnicoId = this.seleccion()[i.id];
    if (!tecnicoId) {
      return;
    }
    this.asignando.set(i.id);
    this.exito.set(null);
    this.errorFila.update((m) => ({ ...m, [i.id]: '' }));
    this.api.asignarTecnico(i.id, tecnicoId).subscribe({
      next: (actualizada) => {
        this.asignando.set(null);
        this.exito.set(`Incidencia #${actualizada.id} asignada a ${actualizada.tecnico?.nombre}.`);
        this.cargar();
      },
      error: (err) => {
        this.asignando.set(null);
        this.errorFila.update((m) => ({ ...m, [i.id]: leerError(err).message }));
      },
    });
  }

  private cargar(): void {
    this.api.listarIncidencias(this.filtroActual).subscribe({
      next: (lista) => {
        this.incidencias.set([...lista].sort((a, b) => b.id - a.id));
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(leerError(e).message);
        this.cargando.set(false);
      },
    });
  }
}

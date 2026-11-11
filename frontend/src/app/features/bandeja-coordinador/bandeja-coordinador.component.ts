import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IncidenciaApiService } from '../../core/incidencia-api.service';
import {
  CATEGORIA_LABEL,
  ESTADOS,
  ESTADO_LABEL,
  Estado,
  Incidencia,
  PRIORIDAD_LABEL,
  Usuario,
  leerError,
} from '../../core/models';

@Component({
  selector: 'app-bandeja-coordinador',
  imports: [RouterLink, DatePipe],
  template: `
    <div class="encabezado">
      <div>
        <h1>Bandeja de coordinación</h1>
        <p>Todas las incidencias. Asigna un técnico a las que están reportadas.</p>
      </div>
    </div>

    <section class="tarjeta tarjeta--plana">
      <div class="tarjeta__cabecera">
        <div class="filtro">
          <label for="filtro" class="etiqueta">Filtrar por estado</label>
          <select id="filtro" (change)="filtrar($any($event.target).value)">
            <option value="">Todos</option>
            @for (e of estados; track e) {
              <option [value]="e">{{ estadoLabel[e] }}</option>
            }
          </select>
        </div>
        <span class="secundario">{{ incidencias().length }} incidencia(s)</span>
      </div>

      @if (error()) {
        <div class="aviso aviso--error" style="margin: 16px" role="alert">{{ error() }}</div>
      }
      @if (exito()) {
        <div class="aviso aviso--ok" style="margin: 16px" role="status">{{ exito() }}</div>
      }

      @if (cargando()) {
        <p class="cargando">Cargando…</p>
      } @else if (incidencias().length === 0) {
        <p class="vacio">No hay incidencias con este filtro.</p>
      } @else {
        <div class="tabla-scroll">
          <table class="tabla">
            <thead>
              <tr>
                <th>#</th><th>Incidencia</th><th>Ubicación</th><th>Reportó</th><th>Estado</th><th>Técnico / acción</th>
              </tr>
            </thead>
            <tbody>
              @for (i of incidencias(); track i.id) {
                <tr>
                  <td class="id" data-label="Folio">
                    <a [routerLink]="['/incidencias', i.id]">#{{ i.id }}</a>
                  </td>
                  <td class="desc" data-label="Incidencia">
                    <strong>{{ categoriaLabel[i.categoria] }}</strong>
                    <span class="chip prio-{{ i.prioridad }}" style="margin-left: 6px">{{ prioridadLabel[i.prioridad] }}</span>
                    <p>{{ i.descripcion }}</p>
                    <span class="secundario">{{ i.fechaReporte | date: 'd MMM y, h:mm a' }}</span>
                  </td>
                  <td data-label="Ubicación">{{ i.ubicacion.edificio }}<br /><span class="secundario">{{ i.ubicacion.nombre }}</span></td>
                  <td data-label="Reportó">{{ i.reportante.nombre }}</td>
                  <td data-label="Estado"><span class="chip estado-{{ i.estado }}">{{ estadoLabel[i.estado] }}</span></td>
                  <td data-label="Técnico">
                    @if (i.estado === 'REPORTADA') {
                      <div class="accion-fila">
                        <select [attr.aria-label]="'Técnico para la incidencia ' + i.id" (change)="elegir(i.id, $any($event.target).value)">
                          <option value="">Selecciona un técnico</option>
                          @for (t of tecnicos(); track t.id) {
                            <option [value]="t.id">{{ t.nombre }}</option>
                          }
                        </select>
                        <div class="fila">
                          <button type="button" class="btn btn--chico" [disabled]="!seleccion()[i.id] || asignando() === i.id" (click)="asignar(i)">
                            {{ asignando() === i.id ? 'Asignando…' : 'Asignar' }}
                          </button>
                        </div>
                        @if (errorFila()[i.id]; as e) { <span class="error-campo">{{ e }}</span> }
                      </div>
                    } @else {
                      {{ i.tecnico?.nombre ?? '—' }}
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>
  `,
})
export class BandejaCoordinadorComponent {
  private readonly api = inject(IncidenciaApiService);

  protected readonly estados = ESTADOS;
  protected readonly estadoLabel = ESTADO_LABEL;
  protected readonly categoriaLabel = CATEGORIA_LABEL;
  protected readonly prioridadLabel = PRIORIDAD_LABEL;

  protected readonly incidencias = signal<Incidencia[]>([]);
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

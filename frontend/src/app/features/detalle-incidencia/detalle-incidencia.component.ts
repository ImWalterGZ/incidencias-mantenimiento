import { DatePipe } from '@angular/common';
import { Component, effect, inject, input, numberAttribute, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { IncidenciaApiService } from '../../core/incidencia-api.service';
import {
  CATEGORIA_LABEL,
  ESTADO_LABEL,
  HistorialEntrada,
  Incidencia,
  PRIORIDAD_LABEL,
  ROL_LABEL,
  TIPO_UBICACION_LABEL,
  leerError,
} from '../../core/models';

@Component({
  selector: 'app-detalle-incidencia',
  imports: [RouterLink, DatePipe],
  template: `
    <div class="encabezado">
      <div>
        <h1>Seguimiento de la incidencia #{{ id() }}</h1>
        <p>Datos completos y bitácora de cambios de estado.</p>
      </div>
      <a class="btn btn--secundario btn--chico" [routerLink]="auth.rutaInicio()" style="text-decoration: none">Volver</a>
    </div>

    @if (cargando()) {
      <p class="cargando">Cargando…</p>
    } @else if (error()) {
      <div class="aviso aviso--error" role="alert">{{ error() }}</div>
    } @else if (incidencia(); as i) {
      <div class="rejilla-2" style="grid-template-columns: minmax(300px, 1fr) minmax(300px, 1fr)">
        <section class="tarjeta">
          <h2>Datos de la incidencia</h2>
          <dl class="datos">
            <dt>Estado</dt><dd><span class="chip estado-{{ i.estado }}">{{ estadoLabel[i.estado] }}</span></dd>
            <dt>Prioridad</dt><dd><span class="chip prio-{{ i.prioridad }}">{{ prioridadLabel[i.prioridad] }}</span></dd>
            <dt>Categoría</dt><dd>{{ categoriaLabel[i.categoria] }}</dd>
            <dt>Ubicación</dt><dd>{{ i.ubicacion.edificio }} · {{ i.ubicacion.nombre }} ({{ tipoLabel[i.ubicacion.tipo] }})</dd>
            <dt>Descripción</dt><dd>{{ i.descripcion }}</dd>
            <dt>Fecha de reporte</dt><dd>{{ i.fechaReporte | date: 'd MMM y, h:mm a' }}</dd>
            <dt>Reportó</dt><dd>{{ i.reportante.nombre }}</dd>
            <dt>Técnico asignado</dt><dd>{{ i.tecnico?.nombre ?? 'Sin asignar' }}</dd>
          </dl>
        </section>

        <section class="tarjeta">
          <h2>Línea de tiempo</h2>
          @if (historial().length === 0) {
            <p class="vacio">Sin movimientos registrados.</p>
          } @else {
            <ol class="linea">
              @for (h of historial(); track h.id) {
                <li>
                  <div class="linea__estado">
                    @if (h.estadoAnterior) {
                      <span class="chip estado-{{ h.estadoAnterior }}">{{ estadoLabel[h.estadoAnterior] }}</span>
                      <span class="linea__flecha" aria-label="a">→</span>
                    } @else {
                      <span class="secundario">Registro inicial:</span>
                    }
                    <span class="chip estado-{{ h.estadoNuevo }}">{{ estadoLabel[h.estadoNuevo] }}</span>
                  </div>
                  <div class="linea__meta">
                    {{ h.realizadoPor }} ({{ rolLabel[h.rolRealizadoPor] }}) · {{ h.fecha | date: 'd MMM y, h:mm a' }}
                  </div>
                  @if (h.comentario) {
                    <p class="linea__comentario">{{ h.comentario }}</p>
                  }
                </li>
              }
            </ol>
          }
        </section>
      </div>
    }
  `,
})
export class DetalleIncidenciaComponent {
  protected readonly auth = inject(AuthService);
  private readonly api = inject(IncidenciaApiService);

  /** Parámetro de ruta :id (se enlaza con withComponentInputBinding o se lee del router). */
  readonly id = input.required<number, string | number>({ transform: numberAttribute });

  protected readonly estadoLabel = ESTADO_LABEL;
  protected readonly categoriaLabel = CATEGORIA_LABEL;
  protected readonly prioridadLabel = PRIORIDAD_LABEL;
  protected readonly rolLabel = ROL_LABEL;
  protected readonly tipoLabel = TIPO_UBICACION_LABEL;

  protected readonly incidencia = signal<Incidencia | null>(null);
  protected readonly historial = signal<HistorialEntrada[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  constructor() {
    effect(() => this.cargar(this.id()));
  }

  private cargar(id: number): void {
    this.cargando.set(true);
    this.error.set(null);
    forkJoin({
      incidencia: this.api.obtenerIncidencia(id),
      historial: this.api.obtenerHistorial(id),
    }).subscribe({
      next: ({ incidencia, historial }) => {
        this.incidencia.set(incidencia);
        this.historial.set(historial);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(leerError(err).message);
        this.cargando.set(false);
      },
    });
  }
}

import { Component, computed, effect, inject, input, numberAttribute, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { IncidenciaApiService } from '../../core/incidencia-api.service';
import { Avatar, Cabecera, EstadoIcono, PrioridadIcono } from '../../shared/ui';
import { SECCION_ROL, fechaCorta, fechaLarga, folio } from '../../shared/util';
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
  imports: [RouterLink, Cabecera, EstadoIcono, PrioridadIcono, Avatar],
  template: `
    <app-cabecera [seccion]="seccion()" [ruta]="auth.rutaInicio()" [actual]="folio(id())">
      <a class="btn btn--secundario btn--chico" [routerLink]="auth.rutaInicio()">Volver</a>
    </app-cabecera>

    @if (cargando()) {
      <p class="cargando">Cargando…</p>
    } @else if (error()) {
      <div class="aviso aviso--error aviso--pagina" role="alert">{{ error() }}</div>
    } @else if (incidencia(); as i) {
      <div class="detalle">
        <div class="detalle__encabezado">
          <p class="detalle__folio mono">{{ folio(i.id) }} <span class="sr-only">Incidencia #{{ i.id }}</span></p>
          <h2 class="detalle__titulo">{{ i.descripcion }}</h2>
        </div>

        <aside class="propiedades" aria-labelledby="props-titulo">
          <h2 id="props-titulo" class="propiedades__titulo">Propiedades</h2>
          <dl class="propiedades__lista">
            <dt>Estado</dt>
            <dd class="estado-{{ i.estado }}">
              <app-estado-icono [estado]="i.estado" [decorativo]="true" />
              <span class="valor-estado">{{ estadoLabel[i.estado] }}</span>
            </dd>
            <dt>Prioridad</dt>
            <dd>
              <app-prioridad-icono [prioridad]="i.prioridad" />
              {{ prioridadLabel[i.prioridad] }}
            </dd>
            <dt>Categoría</dt>
            <dd>{{ categoriaLabel[i.categoria] }}</dd>
            <dt>Ubicación</dt>
            <dd class="dd-apilado">
              {{ i.ubicacion.nombre }}
              <span class="secundario">{{ i.ubicacion.edificio }} · {{ tipoLabel[i.ubicacion.tipo] }}</span>
            </dd>
            <dt>Reportó</dt>
            <dd><app-avatar [nombre]="i.reportante.nombre" /> {{ i.reportante.nombre }}</dd>
            <dt>Técnico</dt>
            <dd>
              <app-avatar [nombre]="i.tecnico?.nombre" rotulo="Técnico" />
              @if (i.tecnico) { {{ i.tecnico.nombre }} } @else { <span class="secundario">Sin asignar</span> }
            </dd>
            <dt>Fecha</dt>
            <dd>{{ fechaLarga(i.fechaReporte) }}</dd>
          </dl>
        </aside>

        <section class="actividad" aria-labelledby="actividad-titulo">
          <h3 id="actividad-titulo" class="actividad__titulo">Actividad</h3>
          @if (historial().length === 0) {
            <p class="secundario">Sin movimientos registrados.</p>
          } @else {
            <ol class="linea">
              @for (h of historial(); track h.id) {
                <li>
                  <span class="linea__marca estado-{{ h.estadoNuevo }}">
                    <app-estado-icono [estado]="h.estadoNuevo" [tamano]="18" [decorativo]="true" />
                  </span>
                  <div class="linea__contenido">
                    <p class="linea__texto">
                      <strong>{{ h.realizadoPor }}</strong>
                      <span class="secundario linea__rol">({{ rolLabel[h.rolRealizadoPor] }})</span>
                      @if (h.estadoAnterior) {
                        cambió el estado de
                        <span class="etiqueta-estado estado-{{ h.estadoAnterior }}">
                          <app-estado-icono [estado]="h.estadoAnterior" [tamano]="14" [decorativo]="true" />{{ estadoLabel[h.estadoAnterior] }}</span>
                        a
                      } @else {
                        reportó la incidencia como
                      }
                      <span class="etiqueta-estado estado-{{ h.estadoNuevo }}">
                        <app-estado-icono [estado]="h.estadoNuevo" [tamano]="14" [decorativo]="true" />{{ estadoLabel[h.estadoNuevo] }}</span>
                      <time class="linea__fecha" [attr.datetime]="h.fecha" [attr.title]="fechaLarga(h.fecha)">· {{ fechaCorta(h.fecha) }}</time>
                    </p>
                    @if (h.comentario) {
                      <blockquote class="linea__comentario">{{ h.comentario }}</blockquote>
                    }
                  </div>
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
  protected readonly folio = folio;
  protected readonly fechaCorta = fechaCorta;
  protected readonly fechaLarga = fechaLarga;
  protected readonly seccion = computed(() => {
    const u = this.auth.usuario();
    return u ? SECCION_ROL[u.rol] : 'Incidencias';
  });

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

import { Component, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IncidenciaApiService } from '../../core/incidencia-api.service';
import { Avatar, Cabecera, EstadoIcono, GrupoEstadoComponent, PrioridadIcono, Toast } from '../../shared/ui';
import { agruparPorEstado, fechaCorta, fechaLarga, folio } from '../../shared/util';
import {
  CATEGORIAS,
  CATEGORIA_LABEL,
  Incidencia,
  PRIORIDADES,
  PRIORIDAD_LABEL,
  TIPO_UBICACION_LABEL,
  Ubicacion,
  leerError,
} from '../../core/models';

const MAX_DESCRIPCION = 1000;
const MIN_DESCRIPCION = 10;

/** Igual que el backend: la longitud mínima se mide sobre el texto recortado. */
function minimoSinEspacios(c: AbstractControl<string | null>): ValidationErrors | null {
  const largo = (c.value ?? '').trim().length;
  return largo > 0 && largo < MIN_DESCRIPCION ? { minlength: { requiredLength: MIN_DESCRIPCION, actualLength: largo } } : null;
}

@Component({
  selector: 'app-mis-incidencias',
  imports: [ReactiveFormsModule, RouterLink, Cabecera, GrupoEstadoComponent, EstadoIcono, PrioridadIcono, Avatar, Toast],
  template: `
    <div class="pagina" [attr.inert]="abierto() ? '' : null" [attr.aria-hidden]="abierto() ? 'true' : null">
      <app-cabecera seccion="Mis incidencias" actual="Mis reportes">
        <span class="cabecera__conteo">{{ incidencias().length }} en total</span>
        <button type="button" class="btn btn--chico" (click)="abrir()">
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
            <path d="M8 3v10M3 8h10" />
          </svg>
          Reportar incidencia
        </button>
      </app-cabecera>

      @if (cargando()) {
        <p class="cargando">Cargando…</p>
      } @else if (errorLista()) {
        <div class="aviso aviso--error aviso--pagina" role="alert">{{ errorLista() }}</div>
      } @else if (incidencias().length === 0) {
        <div class="vacio">
          <p class="vacio__titulo">Aún no has reportado incidencias</p>
          <p>Cuando reportes una falla aparecerá aquí, agrupada por su estado de atención.</p>
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
                <app-avatar [nombre]="i.tecnico?.nombre" rotulo="Técnico" />
                <time class="fila__fecha" [attr.datetime]="i.fechaReporte" [attr.title]="fechaLarga(i.fechaReporte)">{{ fechaCorta(i.fechaReporte) }}</time>
              </article>
            }
          </app-grupo-estado>
        }
      }
    </div>

    @if (abierto()) {
      <div class="drawer-fondo" (click)="cerrar()" aria-hidden="true"></div>
      <div class="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-titulo" (keydown)="teclado($event)">
        <form class="drawer__form" [formGroup]="form" (ngSubmit)="reportar()" novalidate>
          <header class="drawer__cabecera">
            <h2 id="drawer-titulo">Nueva incidencia</h2>
            <button type="button" class="btn-icono" aria-label="Cerrar panel" (click)="cerrar()">
              <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          </header>

          <div class="drawer__cuerpo">
            @if (error()) {
              <div class="aviso aviso--error" role="alert">{{ error() }}</div>
            }

            <div class="campo campo--grande" [class.campo--error]="errorDe('descripcion')">
              <label for="descripcion">¿Qué está fallando?</label>
              <textarea id="descripcion" formControlName="descripcion" [maxlength]="max + 50"
                placeholder="Describe la falla y desde cuándo ocurre (mínimo 10 caracteres)"></textarea>
              <div class="ayuda-campo">
                <span>
                  @if (errorDe('descripcion'); as e) { <span class="error-campo">{{ e }}</span> }
                </span>
                <span class="mono" [class.contador--excedido]="longitud() > max">{{ longitud() }} / {{ max }}</span>
              </div>
            </div>

            <div class="propiedades-fila">
              <div class="campo campo--compacto" [class.campo--error]="errorDe('ubicacionId')">
                <label for="ubicacion">Ubicación</label>
                <select id="ubicacion" formControlName="ubicacionId">
                  <option [ngValue]="null" disabled>Selecciona</option>
                  @for (g of gruposUbicacion(); track g.edificio) {
                    <optgroup [label]="g.edificio">
                      @for (u of g.ubicaciones; track u.id) {
                        <option [ngValue]="u.id">{{ u.nombre }} ({{ tipoLabel[u.tipo] }})</option>
                      }
                    </optgroup>
                  }
                </select>
                @if (errorDe('ubicacionId'); as e) { <span class="error-campo">{{ e }}</span> }
              </div>
              <div class="campo campo--compacto" [class.campo--error]="errorDe('categoria')">
                <label for="categoria">Categoría</label>
                <select id="categoria" formControlName="categoria">
                  <option [ngValue]="null" disabled>Selecciona</option>
                  @for (c of categorias; track c) {
                    <option [ngValue]="c">{{ categoriaLabel[c] }}</option>
                  }
                </select>
                @if (errorDe('categoria'); as e) { <span class="error-campo">{{ e }}</span> }
              </div>
              <div class="campo campo--compacto" [class.campo--error]="errorDe('prioridad')">
                <label for="prioridad">Prioridad</label>
                <select id="prioridad" formControlName="prioridad">
                  @for (p of prioridades; track p) {
                    <option [ngValue]="p">{{ prioridadLabel[p] }}</option>
                  }
                </select>
                @if (errorDe('prioridad'); as e) { <span class="error-campo">{{ e }}</span> }
              </div>
            </div>
          </div>

          <footer class="drawer__pie">
            <button type="button" class="btn btn--secundario" (click)="cerrar()">Cancelar</button>
            <button class="btn" type="submit" [disabled]="enviando()">
              {{ enviando() ? 'Enviando…' : 'Reportar incidencia' }}
            </button>
          </footer>
        </form>
      </div>
    }

    <app-toast [mensaje]="exito()" (cerrar)="exito.set(null)" />
  `,
})
export class MisIncidenciasComponent {
  private readonly api = inject(IncidenciaApiService);

  protected readonly max = MAX_DESCRIPCION;
  protected readonly categorias = CATEGORIAS;
  protected readonly prioridades = PRIORIDADES;
  protected readonly categoriaLabel = CATEGORIA_LABEL;
  protected readonly prioridadLabel = PRIORIDAD_LABEL;
  protected readonly folio = folio;
  protected readonly fechaCorta = fechaCorta;
  protected readonly fechaLarga = fechaLarga;
  protected readonly tipoLabel = TIPO_UBICACION_LABEL;

  protected readonly form = inject(FormBuilder).group({
    ubicacionId: [null as number | null, Validators.required],
    categoria: [null as (typeof CATEGORIAS)[number] | null, Validators.required],
    prioridad: ['MEDIA' as (typeof PRIORIDADES)[number], Validators.required],
    descripcion: ['', [Validators.required, minimoSinEspacios, Validators.maxLength(MAX_DESCRIPCION)]],
  });

  protected readonly ubicaciones = signal<Ubicacion[]>([]);
  protected readonly incidencias = signal<Incidencia[]>([]);
  protected readonly cargando = signal(true);
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly errorLista = signal<string | null>(null);
  protected readonly exito = signal<string | null>(null);
  protected readonly camposServidor = signal<Record<string, string>>({});
  protected readonly longitud = signal(0);
  protected readonly abierto = signal(false);
  protected readonly grupos = computed(() => agruparPorEstado(this.incidencias()));
  private disparador: HTMLElement | null = null;

  protected readonly gruposUbicacion = computed(() => {
    const mapa = new Map<string, Ubicacion[]>();
    for (const u of this.ubicaciones()) {
      mapa.set(u.edificio, [...(mapa.get(u.edificio) ?? []), u]);
    }
    return [...mapa].map(([edificio, ubicaciones]) => ({ edificio, ubicaciones }));
  });

  constructor() {
    this.api.listarUbicaciones().subscribe({
      next: (u) => this.ubicaciones.set(u),
      error: (e) => this.error.set(leerError(e).message),
    });
    this.cargar();
    this.form.controls.descripcion.valueChanges.subscribe((v) => this.longitud.set(v?.length ?? 0));
  }

  /** Error de un campo: primero el que devolvió el servidor, luego la validación local. */
  protected errorDe(campo: 'ubicacionId' | 'categoria' | 'prioridad' | 'descripcion'): string | null {
    const servidor = this.camposServidor()[campo];
    if (servidor) {
      return servidor;
    }
    const c = this.form.controls[campo];
    if (!(c.invalid && (c.touched || c.dirty))) {
      return null;
    }
    if (campo === 'descripcion') {
      return c.hasError('required') ? 'La descripción es obligatoria' : 'La descripción debe tener entre 10 y 1000 caracteres';
    }
    return campo === 'ubicacionId' ? 'La ubicación es obligatoria' : campo === 'categoria' ? 'La categoría es obligatoria' : 'La prioridad es obligatoria';
  }

  protected abrir(): void {
    this.disparador = document.activeElement as HTMLElement | null;
    this.exito.set(null);
    this.abierto.set(true);
    setTimeout(() => document.getElementById('descripcion')?.focus());
  }

  protected cerrar(): void {
    this.abierto.set(false);
    setTimeout(() => this.disparador?.focus());
  }

  /** Escape cierra el panel; Tab se queda dentro de él mientras está abierto. */
  protected teclado(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      e.preventDefault();
      this.cerrar();
      return;
    }
    if (e.key !== 'Tab') {
      return;
    }
    const foco = Array.from(
      (e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('button, select, textarea, input, a[href]'),
    ).filter((el) => !(el as HTMLButtonElement).disabled);
    const primero = foco[0];
    const ultimo = foco[foco.length - 1];
    if (e.shiftKey && document.activeElement === primero) {
      e.preventDefault();
      ultimo.focus();
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault();
      primero.focus();
    }
  }

  protected reportar(): void {
    this.exito.set(null);
    this.error.set(null);
    this.camposServidor.set({});
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    const v = this.form.getRawValue();
    this.api
      .registrarIncidencia({
        ubicacionId: v.ubicacionId!,
        categoria: v.categoria!,
        prioridad: v.prioridad!,
        descripcion: v.descripcion!.trim(),
      })
      .subscribe({
        next: (creada) => {
          this.exito.set(`Incidencia #${creada.id} registrada. Quedó en estado «Reportada».`);
          this.form.reset({ ubicacionId: null, categoria: null, prioridad: 'MEDIA', descripcion: '' });
          this.enviando.set(false);
          this.cerrar();
          this.cargar();
        },
        error: (err) => {
          const e = leerError(err);
          this.error.set(e.message);
          this.camposServidor.set(e.campos);
          this.enviando.set(false);
        },
      });
  }

  private cargar(): void {
    this.api.listarIncidencias().subscribe({
      next: (lista) => {
        this.incidencias.set([...lista].sort((a, b) => b.id - a.id));
        this.cargando.set(false);
      },
      error: (e) => {
        this.errorLista.set(leerError(e).message);
        this.cargando.set(false);
      },
    });
  }
}

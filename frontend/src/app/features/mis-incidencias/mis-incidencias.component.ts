import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IncidenciaApiService } from '../../core/incidencia-api.service';
import {
  CATEGORIAS,
  CATEGORIA_LABEL,
  ESTADO_LABEL,
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
  imports: [ReactiveFormsModule, RouterLink, DatePipe],
  template: `
    <div class="encabezado">
      <div>
        <h1>Mis incidencias</h1>
        <p>Reporta una falla y da seguimiento a su atención.</p>
      </div>
    </div>

    <div class="rejilla-2">
      <form class="tarjeta" [formGroup]="form" (ngSubmit)="reportar()" novalidate>
        <h2>Reportar incidencia</h2>
        @if (error()) {
          <div class="aviso aviso--error" role="alert">{{ error() }}</div>
        }
        @if (exito()) {
          <div class="aviso aviso--ok" role="status">{{ exito() }}</div>
        }

        <div class="campo" [class.campo--error]="errorDe('ubicacionId')">
          <label for="ubicacion">Ubicación</label>
          <select id="ubicacion" formControlName="ubicacionId">
            <option [ngValue]="null" disabled>Selecciona una ubicación</option>
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

        <div class="fila-campos">
          <div class="campo" [class.campo--error]="errorDe('categoria')">
            <label for="categoria">Categoría</label>
            <select id="categoria" formControlName="categoria">
              <option [ngValue]="null" disabled>Selecciona</option>
              @for (c of categorias; track c) {
                <option [ngValue]="c">{{ categoriaLabel[c] }}</option>
              }
            </select>
            @if (errorDe('categoria'); as e) { <span class="error-campo">{{ e }}</span> }
          </div>
          <div class="campo" [class.campo--error]="errorDe('prioridad')">
            <label for="prioridad">Prioridad</label>
            <select id="prioridad" formControlName="prioridad">
              @for (p of prioridades; track p) {
                <option [ngValue]="p">{{ prioridadLabel[p] }}</option>
              }
            </select>
            @if (errorDe('prioridad'); as e) { <span class="error-campo">{{ e }}</span> }
          </div>
        </div>

        <div class="campo" [class.campo--error]="errorDe('descripcion')">
          <label for="descripcion">Descripción</label>
          <textarea id="descripcion" formControlName="descripcion" [maxlength]="max + 50"
            placeholder="Describe qué falla y desde cuándo (mínimo 10 caracteres)"></textarea>
          <div class="ayuda-campo">
            <span>
              @if (errorDe('descripcion'); as e) { <span class="error-campo">{{ e }}</span> }
            </span>
            <span [class.contador--excedido]="longitud() > max">{{ longitud() }} / {{ max }}</span>
          </div>
        </div>

        <button class="btn btn--block" type="submit" [disabled]="enviando()">
          {{ enviando() ? 'Enviando…' : 'Reportar incidencia' }}
        </button>
      </form>

      <section class="tarjeta tarjeta--plana">
        <div class="tarjeta__cabecera"><h2>Historial de mis reportes</h2><span class="secundario">{{ incidencias().length }} en total</span></div>
        @if (cargando()) {
          <p class="cargando">Cargando…</p>
        } @else if (errorLista()) {
          <div class="aviso aviso--error" style="margin: 16px" role="alert">{{ errorLista() }}</div>
        } @else if (incidencias().length === 0) {
          <p class="vacio">Aún no has reportado incidencias.</p>
        } @else {
          <div class="lista-tarjetas" style="padding: 16px">
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
                <div class="item__pie">
                  <span class="secundario">
                    {{ i.ubicacion.edificio }} · {{ i.ubicacion.nombre }} · {{ i.fechaReporte | date: 'd MMM y, h:mm a' }}
                    @if (i.tecnico) { · Técnico: {{ i.tecnico.nombre }} }
                  </span>
                  <a class="btn btn--secundario btn--chico" [routerLink]="['/incidencias', i.id]" style="text-decoration: none">Ver seguimiento</a>
                </div>
              </article>
            }
          </div>
        }
      </section>
    </div>
  `,
})
export class MisIncidenciasComponent {
  private readonly api = inject(IncidenciaApiService);

  protected readonly max = MAX_DESCRIPCION;
  protected readonly categorias = CATEGORIAS;
  protected readonly prioridades = PRIORIDADES;
  protected readonly categoriaLabel = CATEGORIA_LABEL;
  protected readonly prioridadLabel = PRIORIDAD_LABEL;
  protected readonly estadoLabel = ESTADO_LABEL;
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

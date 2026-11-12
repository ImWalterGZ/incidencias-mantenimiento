import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ESTADOS, ESTADO_LABEL, ROL_LABEL, Rol, leerError } from '../../core/models';
import { EstadoIcono } from '../../shared/ui';
import { iniciales } from '../../shared/util';

interface UsuarioPrueba {
  username: string;
  nombre: string;
  rol: Rol;
}

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, EstadoIcono],
  template: `
    <div class="login">
      <section class="login__izq">
        <div class="login__marca">
          <svg class="isotipo" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <rect width="24" height="24" rx="6" fill="#ff0034" />
            <circle cx="12" cy="12" r="6" fill="none" stroke="#fff" stroke-width="1.75" />
            <path d="M12 12V7.5A4.5 4.5 0 0 1 12 16.5Z" fill="#fff" />
          </svg>
          <span>Mantenimiento <span class="marca__punto">·</span> UTCH</span>
        </div>

        <div class="login__centro">
          <h1 class="login__titulo">Cada falla del campus, con folio, responsable y bitácora.</h1>
          <p class="login__texto">Reporta una incidencia, asígnala a un técnico y sigue su atención hasta que quede resuelta.</p>

          <form [formGroup]="form" (ngSubmit)="entrar()" novalidate aria-label="Iniciar sesión">
            @if (error()) {
              <div class="aviso aviso--error" role="alert">{{ error() }}</div>
            }
            <div class="campo" [class.campo--error]="campoInvalido('username')">
              <label for="username">Usuario</label>
              <input id="username" formControlName="username" autocomplete="username" spellcheck="false" />
              @if (campoInvalido('username')) {
                <span class="error-campo">El usuario es obligatorio</span>
              }
            </div>
            <div class="campo" [class.campo--error]="campoInvalido('password')">
              <label for="password">Contraseña</label>
              <input id="password" type="password" formControlName="password" autocomplete="current-password" />
              @if (campoInvalido('password')) {
                <span class="error-campo">La contraseña es obligatoria</span>
              }
            </div>
            <button class="btn btn--block" type="submit" [disabled]="enviando()">
              {{ enviando() ? 'Entrando…' : 'Entrar' }}
            </button>
          </form>
        </div>

        <p class="login__pie">Prototipo escolar · Arquitecturas de Software</p>
      </section>

      <aside class="login__der" aria-labelledby="demo-titulo">
        <div class="demo">
          <p class="demo__rotulo">Entorno de pruebas</p>
          <h2 id="demo-titulo" class="demo__titulo">Cuentas de demostración</h2>
          <p class="demo__texto">
            Elige una cuenta para rellenar el formulario. La contraseña de todas es
            <code class="mono">Incidencias2026</code>.
          </p>

          <div class="demo__lista">
            @for (u of usuariosPrueba; track u.username) {
              <button type="button" class="cuenta" [attr.aria-pressed]="form.controls.username.value === u.username" [class.cuenta--activa]="form.controls.username.value === u.username" (click)="rellenar(u)">
                <span class="avatar avatar--md" aria-hidden="true">{{ iniciales(u.nombre) }}</span>
                <span class="cuenta__id">
                  <span class="cuenta__user mono">{{ u.username }}</span>
                  <span class="cuenta__nombre">{{ u.nombre }}</span>
                </span>
                <span class="cuenta__rol">{{ rolLabel[u.rol] }}</span>
                <span class="cuenta__usar" aria-hidden="true">Usar</span>
              </button>
            }
          </div>

          <div class="ciclo" aria-label="Ciclo de una incidencia">
            <p class="demo__rotulo">Ciclo de una incidencia</p>
            <ol class="ciclo__pasos">
              @for (e of ciclo; track e) {
                <li class="estado-{{ e }}">
                  <app-estado-icono [estado]="e" [tamano]="18" [decorativo]="true" />
                  <span>{{ estadoLabel[e] }}</span>
                </li>
              }
            </ol>
          </div>
        </div>
      </aside>
    </div>
  `,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly rolLabel = ROL_LABEL;
  protected readonly estadoLabel = ESTADO_LABEL;
  protected readonly ciclo = ESTADOS;
  protected readonly iniciales = iniciales;
  protected readonly usuariosPrueba: UsuarioPrueba[] = [
    { username: 'ana', nombre: 'Ana López', rol: 'USUARIO' },
    { username: 'bruno', nombre: 'Bruno Ortega', rol: 'USUARIO' },
    { username: 'carlos', nombre: 'Carlos Méndez', rol: 'TECNICO' },
    { username: 'diana', nombre: 'Diana Ruiz', rol: 'TECNICO' },
    { username: 'elena', nombre: 'Elena Salazar', rol: 'COORDINADOR' },
  ];

  protected readonly form = inject(FormBuilder).nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);

  constructor() {
    if (this.auth.usuario()) {
      this.router.navigateByUrl(this.auth.rutaInicio());
    }
  }

  protected campoInvalido(nombre: 'username' | 'password'): boolean {
    const c = this.form.controls[nombre];
    return c.invalid && (c.touched || c.dirty);
  }

  protected rellenar(u: UsuarioPrueba): void {
    this.form.setValue({ username: u.username, password: 'Incidencias2026' });
    this.error.set(null);
  }

  protected entrar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.error.set(null);
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => this.router.navigateByUrl(this.auth.rutaInicio()),
      error: (err) => {
        this.error.set(leerError(err).message);
        this.enviando.set(false);
      },
    });
  }
}

import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ROL_LABEL, Rol, leerError } from '../../core/models';

interface UsuarioPrueba {
  username: string;
  nombre: string;
  rol: Rol;
}

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  template: `
    <section class="login">
      <div class="login__titulo">
        <h1>Iniciar sesión</h1>
        <p class="secundario">Sistema de control de incidencias de mantenimiento</p>
      </div>

      <form class="tarjeta" [formGroup]="form" (ngSubmit)="entrar()" novalidate>
        @if (error()) {
          <div class="aviso aviso--error" role="alert">{{ error() }}</div>
        }
        <div class="campo" [class.campo--error]="campoInvalido('username')">
          <label for="username">Usuario</label>
          <input id="username" formControlName="username" autocomplete="username" />
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

      <aside class="demo" aria-label="Usuarios de prueba">
        <h2>Usuarios de prueba</h2>
        <p>Contraseña de todos: <strong>Incidencias2026</strong>. Elige uno para rellenar el formulario.</p>
        <div class="demo__lista">
          @for (u of usuariosPrueba; track u.username) {
            <button type="button" class="demo__btn" (click)="rellenar(u)">
              <span><strong>{{ u.username }}</strong> · {{ u.nombre }}</span>
              <small>{{ rolLabel[u.rol] }}</small>
            </button>
          }
        </div>
      </aside>
    </section>
  `,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly rolLabel = ROL_LABEL;
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

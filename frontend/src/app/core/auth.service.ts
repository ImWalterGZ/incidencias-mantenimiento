import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginRequest, LoginResponse, RUTA_INICIO, Rol, Usuario } from './models';

const CLAVE_TOKEN = 'incidencias.token';
const CLAVE_USUARIO = 'incidencias.usuario';
const CLAVE_EXPIRA = 'incidencias.expiraEn';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly _usuario = signal<Usuario | null>(this.leerSesion());
  readonly usuario = this._usuario.asReadonly();
  readonly rutaInicio = computed(() => {
    const u = this._usuario();
    return u ? RUTA_INICIO[u.rol] : '/login';
  });

  get token(): string | null {
    return localStorage.getItem(CLAVE_TOKEN);
  }

  tieneRol(...roles: Rol[]): boolean {
    const u = this._usuario();
    return !!u && (roles.length === 0 || roles.includes(u.rol));
  }

  login(credenciales: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, credenciales).pipe(
      tap((r) => {
        localStorage.setItem(CLAVE_TOKEN, r.token);
        localStorage.setItem(CLAVE_USUARIO, JSON.stringify(r.usuario));
        localStorage.setItem(CLAVE_EXPIRA, String(Date.now() + r.expiraEnMs));
        this._usuario.set(r.usuario);
      }),
    );
  }

  logout(): void {
    this.limpiar();
    this.router.navigate(['/login']);
  }

  /** Lo invoca el interceptor cuando el backend responde 401: la sesión ya no es válida. */
  alRecibir401(): void {
    if (this._usuario()) {
      this.logout();
    }
  }

  private limpiar(): void {
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_USUARIO);
    localStorage.removeItem(CLAVE_EXPIRA);
    this._usuario.set(null);
  }

  private leerSesion(): Usuario | null {
    try {
      const token = localStorage.getItem(CLAVE_TOKEN);
      const usuario = localStorage.getItem(CLAVE_USUARIO);
      const expira = Number(localStorage.getItem(CLAVE_EXPIRA));
      if (!token || !usuario || !(expira > Date.now())) {
        return null;
      }
      return JSON.parse(usuario) as Usuario;
    } catch {
      return null;
    }
  }
}

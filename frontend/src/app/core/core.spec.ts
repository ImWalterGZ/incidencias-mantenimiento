import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../environments/environment';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';
import { leerError } from './models';
import { roleGuard } from './role.guard';

const API = environment.apiUrl;
const respuestaLogin = {
  token: 'abc',
  expiraEnMs: 60_000,
  usuario: { id: 5, nombre: 'Elena Salazar', username: 'elena', rol: 'COORDINADOR' as const },
};

describe('núcleo de autenticación', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let auth: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
  });

  it('login guarda token y usuario y expone el usuario como signal', () => {
    auth.login({ username: 'elena', password: 'x' }).subscribe();
    backend.expectOne(`${API}/auth/login`).flush(respuestaLogin);
    expect(auth.usuario()?.rol).toBe('COORDINADOR');
    expect(localStorage.getItem('incidencias.token')).toBe('abc');
    expect(auth.rutaInicio()).toBe('/coordinacion');
  });

  it('el interceptor agrega Authorization: Bearer cuando hay sesión', () => {
    auth.login({ username: 'elena', password: 'x' }).subscribe();
    backend.expectOne(`${API}/auth/login`).flush(respuestaLogin);
    http.get(`${API}/incidencias`).subscribe();
    const req = backend.expectOne(`${API}/incidencias`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer abc');
    req.flush([]);
  });

  it('un 401 cierra la sesión y manda al login', () => {
    auth.login({ username: 'elena', password: 'x' }).subscribe();
    backend.expectOne(`${API}/auth/login`).flush(respuestaLogin);
    const router = TestBed.inject(Router);
    let navegado: unknown = null;
    router.navigate = (async (cmds: unknown) => (navegado = cmds)) as typeof router.navigate;
    http.get(`${API}/incidencias`).subscribe({ error: () => undefined });
    backend.expectOne(`${API}/incidencias`).flush({ message: 'x' }, { status: 401, statusText: 'Unauthorized' });
    expect(auth.usuario()).toBeNull();
    expect(localStorage.getItem('incidencias.token')).toBeNull();
    expect(navegado).toEqual(['/login']);
  });

  it('roleGuard redirige al login sin sesión y a la pantalla propia con rol incorrecto', () => {
    const guard = () => TestBed.runInInjectionContext(() => roleGuard('USUARIO')({} as never, {} as never));
    expect(String(guard())).toBe('/login');
    auth.login({ username: 'elena', password: 'x' }).subscribe();
    backend.expectOne(`${API}/auth/login`).flush(respuestaLogin);
    expect(String(guard())).toBe('/coordinacion');
  });

  it('leerError devuelve el mensaje y los campos del backend', () => {
    const r = leerError({ status: 400, error: { message: 'Datos inválidos', campos: { descripcion: 'Muy corta' } } });
    expect(r.message).toBe('Datos inválidos');
    expect(r.campos['descripcion']).toBe('Muy corta');
  });
});

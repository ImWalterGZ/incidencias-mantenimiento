import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Estado,
  HistorialEntrada,
  Incidencia,
  IncidenciaRequest,
  Ubicacion,
  Usuario,
} from './models';

@Injectable({ providedIn: 'root' })
export class IncidenciaApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  listarUbicaciones(): Observable<Ubicacion[]> {
    return this.http.get<Ubicacion[]>(`${this.base}/ubicaciones`);
  }

  listarTecnicos(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.base}/usuarios`, { params: { rol: 'TECNICO' } });
  }

  listarIncidencias(estado?: Estado | ''): Observable<Incidencia[]> {
    let params = new HttpParams();
    if (estado) {
      params = params.set('estado', estado);
    }
    return this.http.get<Incidencia[]>(`${this.base}/incidencias`, { params });
  }

  obtenerIncidencia(id: number): Observable<Incidencia> {
    return this.http.get<Incidencia>(`${this.base}/incidencias/${id}`);
  }

  obtenerHistorial(id: number): Observable<HistorialEntrada[]> {
    return this.http.get<HistorialEntrada[]>(`${this.base}/incidencias/${id}/historial`);
  }

  registrarIncidencia(datos: IncidenciaRequest): Observable<Incidencia> {
    return this.http.post<Incidencia>(`${this.base}/incidencias`, datos);
  }

  asignarTecnico(id: number, tecnicoId: number, comentario?: string): Observable<Incidencia> {
    return this.http.patch<Incidencia>(`${this.base}/incidencias/${id}/asignacion`, {
      tecnicoId,
      comentario: comentario || null,
    });
  }

  cambiarEstado(id: number, estado: Estado, comentario?: string): Observable<Incidencia> {
    return this.http.patch<Incidencia>(`${this.base}/incidencias/${id}/estado`, {
      estado,
      comentario: comentario || null,
    });
  }
}

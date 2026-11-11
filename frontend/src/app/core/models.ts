export type Rol = 'USUARIO' | 'TECNICO' | 'COORDINADOR';
export type Categoria =
  | 'ELECTRICA'
  | 'PLOMERIA'
  | 'MOBILIARIO'
  | 'EQUIPO_COMPUTO'
  | 'CLIMATIZACION'
  | 'OTRA';
export type Prioridad = 'BAJA' | 'MEDIA' | 'ALTA';
export type Estado = 'REPORTADA' | 'ASIGNADA' | 'EN_PROCESO' | 'RESUELTA';

export interface Usuario {
  id: number;
  nombre: string;
  username: string;
  rol: Rol;
}

export interface Ubicacion {
  id: number;
  edificio: string;
  nombre: string;
  tipo: 'AULA' | 'LABORATORIO' | 'OFICINA';
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expiraEnMs: number;
  usuario: Usuario;
}

export interface Incidencia {
  id: number;
  ubicacion: Ubicacion;
  categoria: Categoria;
  descripcion: string;
  prioridad: Prioridad;
  estado: Estado;
  fechaReporte: string;
  reportante: Usuario;
  tecnico: Usuario | null;
}

export interface IncidenciaRequest {
  ubicacionId: number;
  categoria: Categoria;
  descripcion: string;
  prioridad: Prioridad;
}

export interface HistorialEntrada {
  id: number;
  estadoAnterior: Estado | null;
  estadoNuevo: Estado;
  comentario: string | null;
  fecha: string;
  realizadoPor: string;
  rolRealizadoPor: Rol;
}

export interface ApiError {
  message: string;
  httpStatus: string;
  timestamp: number;
  campos?: Record<string, string>;
}

export const ESTADOS: Estado[] = ['REPORTADA', 'ASIGNADA', 'EN_PROCESO', 'RESUELTA'];
export const CATEGORIAS: Categoria[] = [
  'ELECTRICA',
  'PLOMERIA',
  'MOBILIARIO',
  'EQUIPO_COMPUTO',
  'CLIMATIZACION',
  'OTRA',
];
export const PRIORIDADES: Prioridad[] = ['BAJA', 'MEDIA', 'ALTA'];

export const ESTADO_LABEL: Record<Estado, string> = {
  REPORTADA: 'Reportada',
  ASIGNADA: 'Asignada',
  EN_PROCESO: 'En proceso',
  RESUELTA: 'Resuelta',
};

export const CATEGORIA_LABEL: Record<Categoria, string> = {
  ELECTRICA: 'Eléctrica',
  PLOMERIA: 'Plomería',
  MOBILIARIO: 'Mobiliario',
  EQUIPO_COMPUTO: 'Equipo de cómputo',
  CLIMATIZACION: 'Climatización',
  OTRA: 'Otra',
};

export const PRIORIDAD_LABEL: Record<Prioridad, string> = {
  BAJA: 'Baja',
  MEDIA: 'Media',
  ALTA: 'Alta',
};

export const ROL_LABEL: Record<Rol, string> = {
  USUARIO: 'Usuario',
  TECNICO: 'Técnico',
  COORDINADOR: 'Coordinador',
};

export const TIPO_UBICACION_LABEL: Record<Ubicacion['tipo'], string> = {
  AULA: 'Aula',
  LABORATORIO: 'Laboratorio',
  OFICINA: 'Oficina',
};

/** Ruta inicial de cada rol después de iniciar sesión. */
export const RUTA_INICIO: Record<Rol, string> = {
  USUARIO: '/mis-incidencias',
  COORDINADOR: '/coordinacion',
  TECNICO: '/tecnico',
};

/** Extrae el mensaje y los errores por campo de una respuesta de error del backend. */
export function leerError(err: unknown): { message: string; campos: Record<string, string> } {
  const e = err as { status?: number; error?: Partial<ApiError> | null };
  if (e?.status === 0) {
    return { message: 'No se pudo conectar con el servidor. Verifica que el backend esté en ejecución.', campos: {} };
  }
  return {
    message: e?.error?.message ?? 'Ocurrió un error inesperado. Inténtalo de nuevo.',
    campos: e?.error?.campos ?? {},
  };
}

import { ESTADOS, Estado, Incidencia, Rol } from '../core/models';

/** Folio visible de una incidencia: INC-005. */
export function folio(id: number): string {
  return 'INC-' + String(id).padStart(3, '0');
}

/** Sección (primer nivel del breadcrumb) de cada rol. */
export const SECCION_ROL: Record<Rol, string> = {
  USUARIO: 'Mis incidencias',
  COORDINADOR: 'Coordinación',
  TECNICO: 'Mis asignaciones',
};

/** Hasta dos iniciales del nombre: «Ana López» → AL. */
export function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  return ((partes[0]?.[0] ?? '') + (partes.length > 1 ? partes[1][0] : '')).toUpperCase();
}

const MS_MIN = 60_000;
const MS_HORA = 60 * MS_MIN;
const MS_DIA = 24 * MS_HORA;

/** Fecha corta para listas: «hace 5 min», «hace 3 h», «ayer», «hace 4 d» o «12 nov». */
export function fechaCorta(iso: string, ahora: number = Date.now()): string {
  const fecha = new Date(iso);
  const diff = ahora - fecha.getTime();
  if (diff < MS_MIN) return 'ahora';
  if (diff < MS_HORA) return `hace ${Math.floor(diff / MS_MIN)} min`;
  if (diff < MS_DIA) return `hace ${Math.floor(diff / MS_HORA)} h`;
  const hoy = new Date(ahora);
  const ayer = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 1);
  if (fecha.getFullYear() === ayer.getFullYear() && fecha.getMonth() === ayer.getMonth() && fecha.getDate() === ayer.getDate()) {
    return 'ayer';
  }
  if (diff < 7 * MS_DIA) return `hace ${Math.floor(diff / MS_DIA)} d`;
  const mismoAnio = fecha.getFullYear() === hoy.getFullYear();
  return new Intl.DateTimeFormat('es-MX', mismoAnio ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' })
    .format(fecha)
    .replace(/\./g, '');
}

/** Fecha completa para `title` y para el panel de propiedades. */
export function fechaLarga(iso: string): string {
  return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    .format(new Date(iso))
    .replace(/\./g, '');
}

export interface GrupoEstado {
  estado: Estado;
  items: Incidencia[];
}

/** Agrupa por estado en el orden del flujo; omite los grupos vacíos. */
export function agruparPorEstado(lista: Incidencia[]): GrupoEstado[] {
  return ESTADOS.map((estado) => ({ estado, items: lista.filter((i) => i.estado === estado) })).filter(
    (g) => g.items.length > 0,
  );
}

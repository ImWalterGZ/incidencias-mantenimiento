package com.incidencias.enums;

/**
 * Máquina de estados de la incidencia (RN4): cada estado solo conoce a su sucesor,
 * así que no hay saltos ni retrocesos posibles.
 */
public enum EstadoIncidencia {
    REPORTADA,
    ASIGNADA,
    EN_PROCESO,
    RESUELTA;

    /** Devuelve el único estado válido después de este, o {@code null} si es final. */
    public EstadoIncidencia siguiente() {
        return switch (this) {
            case REPORTADA -> ASIGNADA;
            case ASIGNADA -> EN_PROCESO;
            case EN_PROCESO -> RESUELTA;
            case RESUELTA -> null;
        };
    }
}

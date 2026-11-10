package com.incidencias.dto;

import java.time.OffsetDateTime;

import com.incidencias.enums.EstadoIncidencia;
import com.incidencias.enums.Rol;

public record HistorialResponseDto(
        Long id,
        EstadoIncidencia estadoAnterior,
        EstadoIncidencia estadoNuevo,
        String comentario,
        OffsetDateTime fecha,
        String realizadoPor,
        Rol rolRealizadoPor) {
}

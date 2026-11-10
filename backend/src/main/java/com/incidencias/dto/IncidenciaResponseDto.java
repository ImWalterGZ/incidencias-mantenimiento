package com.incidencias.dto;

import java.time.OffsetDateTime;

import com.incidencias.enums.Categoria;
import com.incidencias.enums.EstadoIncidencia;
import com.incidencias.enums.Prioridad;

public record IncidenciaResponseDto(
        Long id,
        UbicacionResponseDto ubicacion,
        Categoria categoria,
        String descripcion,
        Prioridad prioridad,
        EstadoIncidencia estado,
        OffsetDateTime fechaReporte,
        UsuarioResponseDto reportante,
        UsuarioResponseDto tecnico) {
}

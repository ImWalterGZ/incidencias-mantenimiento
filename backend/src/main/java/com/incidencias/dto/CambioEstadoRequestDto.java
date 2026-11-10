package com.incidencias.dto;

import com.incidencias.enums.EstadoIncidencia;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CambioEstadoRequestDto(@NotNull(message = "El estado es obligatorio") EstadoIncidencia estado,
        @Size(max = 500, message = "El comentario admite hasta 500 caracteres") String comentario) {
}

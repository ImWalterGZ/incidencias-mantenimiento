package com.incidencias.dto;

import com.incidencias.enums.EstadoIncidencia;

import com.incidencias.constants.Constants;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CambioEstadoRequestDto(@NotNull(message = "El estado es obligatorio") EstadoIncidencia estado,
        @Size(max = 500, message = "El comentario admite hasta 500 caracteres")
        @Pattern(regexp = Constants.TEXTO_SIN_NULOS, message = "El comentario contiene caracteres no permitidos") String comentario) {

    public CambioEstadoRequestDto {
        comentario = comentario == null || comentario.isBlank() ? null : comentario.strip();
    }
}

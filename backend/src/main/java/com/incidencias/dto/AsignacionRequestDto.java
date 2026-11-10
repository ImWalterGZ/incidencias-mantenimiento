package com.incidencias.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AsignacionRequestDto(@NotNull(message = "El técnico es obligatorio") Long tecnicoId,
        @Size(max = 500, message = "El comentario admite hasta 500 caracteres") String comentario) {
}

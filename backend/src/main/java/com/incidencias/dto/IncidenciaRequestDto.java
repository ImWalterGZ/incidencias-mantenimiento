package com.incidencias.dto;

import com.incidencias.enums.Categoria;
import com.incidencias.enums.Prioridad;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Lo que el usuario captura (RN1). El estado y la fecha no vienen aquí: los fija el servicio (RN2). */
public record IncidenciaRequestDto(
        @NotNull(message = "La ubicación es obligatoria") Long ubicacionId,
        @NotNull(message = "La categoría es obligatoria") Categoria categoria,
        @NotBlank(message = "La descripción es obligatoria")
        @Size(min = 10, max = 1000, message = "La descripción debe tener entre 10 y 1000 caracteres") String descripcion,
        @NotNull(message = "La prioridad es obligatoria") Prioridad prioridad) {
}

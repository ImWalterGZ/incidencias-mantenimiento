package com.incidencias.dto;

import com.incidencias.enums.TipoUbicacion;

public record UbicacionResponseDto(Long id, String edificio, String nombre, TipoUbicacion tipo) {
}

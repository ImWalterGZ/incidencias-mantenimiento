package com.incidencias.dto;

import com.incidencias.enums.Rol;

public record UsuarioResponseDto(Long id, String nombre, String username, Rol rol) {
}

package com.incidencias.dto;

public record JwtResponseDto(String token, long expiraEnMs, UsuarioResponseDto usuario) {
}

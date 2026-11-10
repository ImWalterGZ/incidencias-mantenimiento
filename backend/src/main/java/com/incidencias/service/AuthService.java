package com.incidencias.service;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import com.incidencias.dto.JwtResponseDto;
import com.incidencias.dto.LoginRequestDto;
import com.incidencias.model.UsuarioModel;
import com.incidencias.util.JwtUtil;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;

    public AuthService(AuthenticationManager authenticationManager, JwtUtil jwtUtil) {
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
    }

    /** Valida las credenciales con BCrypt; si fallan, Spring lanza BadCredentialsException (401). */
    public JwtResponseDto login(LoginRequestDto request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password()));
        UsuarioModel usuario = (UsuarioModel) authentication.getPrincipal();
        return new JwtResponseDto(jwtUtil.generateToken(usuario), jwtUtil.getExpiration(), usuario.toDto());
    }
}

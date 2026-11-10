package com.incidencias.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.incidencias.dto.UsuarioResponseDto;
import com.incidencias.enums.Rol;
import com.incidencias.service.UsuarioService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("${api.base-path}/usuarios")
@Tag(name = "Usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @GetMapping
    @Operation(summary = "Usuarios por rol; el coordinador lo usa para elegir técnico (RF6)")
    public ResponseEntity<List<UsuarioResponseDto>> findByRol(@RequestParam Rol rol) {
        return ResponseEntity.ok(usuarioService.findByRol(rol));
    }
}

package com.incidencias.controller;

import java.net.URI;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.incidencias.dto.AsignacionRequestDto;
import com.incidencias.dto.CambioEstadoRequestDto;
import com.incidencias.dto.HistorialResponseDto;
import com.incidencias.dto.IncidenciaRequestDto;
import com.incidencias.dto.IncidenciaResponseDto;
import com.incidencias.enums.EstadoIncidencia;
import com.incidencias.model.UsuarioModel;
import com.incidencias.service.IncidenciaService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("${api.base-path}/incidencias")
@Tag(name = "Incidencias")
public class IncidenciaController {

    private final IncidenciaService incidenciaService;

    public IncidenciaController(IncidenciaService incidenciaService) {
        this.incidenciaService = incidenciaService;
    }

    @PostMapping
    @Operation(summary = "Registra una incidencia; siempre inicia como REPORTADA (RF3, RN2)")
    public ResponseEntity<IncidenciaResponseDto> registrar(@Valid @RequestBody IncidenciaRequestDto dto,
            @AuthenticationPrincipal UsuarioModel usuario) {
        IncidenciaResponseDto creada = incidenciaService.registrar(dto, usuario);
        return ResponseEntity.created(URI.create("incidencias/" + creada.id())).body(creada);
    }

    @GetMapping
    @Operation(summary = "Lista según el rol: propias, asignadas o todas (RF4, RN7)")
    public ResponseEntity<List<IncidenciaResponseDto>> listar(
            @Parameter(description = "Filtro opcional por estado") @RequestParam(required = false) EstadoIncidencia estado,
            @AuthenticationPrincipal UsuarioModel usuario) {
        return ResponseEntity.ok(incidenciaService.listar(usuario, estado));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Detalle de una incidencia visible para el usuario (RF5)")
    public ResponseEntity<IncidenciaResponseDto> findById(@PathVariable Long id,
            @AuthenticationPrincipal UsuarioModel usuario) {
        return ResponseEntity.ok(incidenciaService.findById(id, usuario));
    }

    @GetMapping("/{id}/historial")
    @Operation(summary = "Seguimiento: historial de cambios de estado en orden (RF9, RN6)")
    public ResponseEntity<List<HistorialResponseDto>> historial(@PathVariable Long id,
            @AuthenticationPrincipal UsuarioModel usuario) {
        return ResponseEntity.ok(incidenciaService.historial(id, usuario));
    }

    @PatchMapping("/{id}/asignacion")
    @Operation(summary = "El coordinador asigna un técnico; REPORTADA → ASIGNADA (RF7, RN3)")
    public ResponseEntity<IncidenciaResponseDto> asignar(@PathVariable Long id,
            @Valid @RequestBody AsignacionRequestDto dto,
            @AuthenticationPrincipal UsuarioModel coordinador) {
        return ResponseEntity.ok(incidenciaService.asignar(id, dto, coordinador));
    }

    @PatchMapping("/{id}/estado")
    @Operation(summary = "El técnico asignado avanza al siguiente estado (RF8, RN4, RN5)")
    public ResponseEntity<IncidenciaResponseDto> cambiarEstado(@PathVariable Long id,
            @Valid @RequestBody CambioEstadoRequestDto dto,
            @AuthenticationPrincipal UsuarioModel tecnico) {
        return ResponseEntity.ok(incidenciaService.cambiarEstado(id, dto, tecnico));
    }
}

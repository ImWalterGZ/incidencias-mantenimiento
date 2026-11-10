package com.incidencias.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.incidencias.dto.UbicacionResponseDto;
import com.incidencias.service.UbicacionService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("${api.base-path}/ubicaciones")
@Tag(name = "Ubicaciones")
public class UbicacionController {

    private final UbicacionService ubicacionService;

    public UbicacionController(UbicacionService ubicacionService) {
        this.ubicacionService = ubicacionService;
    }

    @GetMapping
    @Operation(summary = "Catálogo de ubicaciones (RF2)")
    public ResponseEntity<List<UbicacionResponseDto>> findAll() {
        return ResponseEntity.ok(ubicacionService.findAll());
    }
}

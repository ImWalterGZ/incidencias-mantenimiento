package com.incidencias.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.incidencias.dto.UsuarioResponseDto;
import com.incidencias.enums.Rol;
import com.incidencias.model.UsuarioModel;
import com.incidencias.repository.UsuarioRepository;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;

    public UsuarioService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional(readOnly = true)
    public List<UsuarioResponseDto> findByRol(Rol rol) {
        return usuarioRepository.findByRolOrderByNombre(rol).stream()
                .map(UsuarioModel::toDto)
                .toList();
    }
}

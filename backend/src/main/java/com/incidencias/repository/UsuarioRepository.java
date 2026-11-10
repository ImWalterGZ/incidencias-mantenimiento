package com.incidencias.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.incidencias.enums.Rol;
import com.incidencias.model.UsuarioModel;

public interface UsuarioRepository extends JpaRepository<UsuarioModel, Long> {

    Optional<UsuarioModel> findByUsername(String username);

    List<UsuarioModel> findByRolOrderByNombre(Rol rol);
}

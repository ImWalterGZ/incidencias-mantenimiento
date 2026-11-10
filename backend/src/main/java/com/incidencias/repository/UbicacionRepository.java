package com.incidencias.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.incidencias.model.UbicacionModel;

public interface UbicacionRepository extends JpaRepository<UbicacionModel, Long> {

    List<UbicacionModel> findAllByOrderByEdificioAscNombreAsc();
}

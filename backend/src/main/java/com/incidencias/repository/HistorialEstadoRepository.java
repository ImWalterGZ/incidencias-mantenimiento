package com.incidencias.repository;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.incidencias.model.HistorialEstadoModel;

public interface HistorialEstadoRepository extends JpaRepository<HistorialEstadoModel, Long> {

    @EntityGraph(attributePaths = {"realizadoPor"})
    List<HistorialEstadoModel> findByIncidenciaIdOrderByFechaAscIdAsc(Long incidenciaId);
}

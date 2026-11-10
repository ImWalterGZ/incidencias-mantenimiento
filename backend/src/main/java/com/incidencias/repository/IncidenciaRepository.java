package com.incidencias.repository;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.incidencias.enums.EstadoIncidencia;
import com.incidencias.model.IncidenciaModel;

public interface IncidenciaRepository extends JpaRepository<IncidenciaModel, Long> {

    /**
     * Consulta única para las tres vistas (RN7): con reportanteId filtra las del usuario, con tecnicoId las
     * asignadas al técnico y con ambos en null devuelve todas (coordinador). El estado es un filtro opcional.
     */
    @EntityGraph(attributePaths = {"ubicacion", "reportante", "tecnico"})
    @Query("""
            select i from IncidenciaModel i
            where (:reportanteId is null or i.reportante.id = :reportanteId)
              and (:tecnicoId is null or i.tecnico.id = :tecnicoId)
              and (:estado is null or i.estado = :estado)
            order by i.fechaReporte desc, i.id desc
            """)
    List<IncidenciaModel> buscar(@Param("reportanteId") Long reportanteId,
            @Param("tecnicoId") Long tecnicoId,
            @Param("estado") EstadoIncidencia estado);
}

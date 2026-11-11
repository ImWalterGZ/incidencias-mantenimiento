package com.incidencias.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.incidencias.enums.EstadoIncidencia;
import com.incidencias.model.IncidenciaModel;

import jakarta.persistence.LockModeType;

public interface IncidenciaRepository extends JpaRepository<IncidenciaModel, Long> {

    /**
     * Lee la incidencia con SELECT ... FOR UPDATE. Dos cambios simultáneos sobre la misma incidencia quedan en fila:
     * el segundo espera a que el primero confirme y entonces ve el estado nuevo, así que la regla lo rechaza (409).
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select i from IncidenciaModel i where i.id = :id")
    Optional<IncidenciaModel> findByIdParaActualizar(@Param("id") Long id);

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

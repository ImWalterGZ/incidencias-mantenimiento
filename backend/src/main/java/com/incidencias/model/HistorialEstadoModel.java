package com.incidencias.model;

import java.time.OffsetDateTime;

import com.incidencias.dto.HistorialResponseDto;
import com.incidencias.enums.EstadoIncidencia;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "historial_estado_incidencia")
public class HistorialEstadoModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "incidencia_id", nullable = false)
    private IncidenciaModel incidencia;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private UsuarioModel realizadoPor;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_anterior", length = 20)
    private EstadoIncidencia estadoAnterior;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_nuevo", nullable = false, length = 20)
    private EstadoIncidencia estadoNuevo;

    @Column(length = 500)
    private String comentario;

    @Column(nullable = false)
    private OffsetDateTime fecha;

    public static HistorialEstadoModel de(IncidenciaModel incidencia, UsuarioModel realizadoPor,
            EstadoIncidencia estadoAnterior, EstadoIncidencia estadoNuevo, String comentario,
            OffsetDateTime fecha) {
        HistorialEstadoModel h = new HistorialEstadoModel();
        h.incidencia = incidencia;
        h.realizadoPor = realizadoPor;
        h.estadoAnterior = estadoAnterior;
        h.estadoNuevo = estadoNuevo;
        h.comentario = comentario;
        h.fecha = fecha;
        return h;
    }

    public HistorialResponseDto toDto() {
        return new HistorialResponseDto(id, estadoAnterior, estadoNuevo, comentario, fecha,
                realizadoPor.getNombre(), realizadoPor.getRol());
    }

    public Long getId() {
        return id;
    }

    public IncidenciaModel getIncidencia() {
        return incidencia;
    }

    public UsuarioModel getRealizadoPor() {
        return realizadoPor;
    }

    public EstadoIncidencia getEstadoAnterior() {
        return estadoAnterior;
    }

    public EstadoIncidencia getEstadoNuevo() {
        return estadoNuevo;
    }

    public String getComentario() {
        return comentario;
    }

    public OffsetDateTime getFecha() {
        return fecha;
    }
}

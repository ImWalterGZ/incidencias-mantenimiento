package com.incidencias.model;

import java.time.OffsetDateTime;

import com.incidencias.dto.IncidenciaResponseDto;
import com.incidencias.enums.Categoria;
import com.incidencias.enums.EstadoIncidencia;
import com.incidencias.enums.Prioridad;

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
@Table(name = "incidencia")
public class IncidenciaModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ubicacion_id", nullable = false)
    private UbicacionModel ubicacion;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reportante_id", nullable = false)
    private UsuarioModel reportante;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tecnico_id")
    private UsuarioModel tecnico;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Categoria categoria;

    @Column(nullable = false, length = 1000)
    private String descripcion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Prioridad prioridad;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EstadoIncidencia estado;

    @Column(name = "fecha_reporte", nullable = false)
    private OffsetDateTime fechaReporte;

    public IncidenciaResponseDto toDto() {
        return new IncidenciaResponseDto(
                id,
                ubicacion.toDto(),
                categoria,
                descripcion,
                prioridad,
                estado,
                fechaReporte,
                reportante.toDto(),
                tecnico == null ? null : tecnico.toDto());
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public UbicacionModel getUbicacion() {
        return ubicacion;
    }

    public void setUbicacion(UbicacionModel ubicacion) {
        this.ubicacion = ubicacion;
    }

    public UsuarioModel getReportante() {
        return reportante;
    }

    public void setReportante(UsuarioModel reportante) {
        this.reportante = reportante;
    }

    public UsuarioModel getTecnico() {
        return tecnico;
    }

    public void setTecnico(UsuarioModel tecnico) {
        this.tecnico = tecnico;
    }

    public Categoria getCategoria() {
        return categoria;
    }

    public void setCategoria(Categoria categoria) {
        this.categoria = categoria;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public Prioridad getPrioridad() {
        return prioridad;
    }

    public void setPrioridad(Prioridad prioridad) {
        this.prioridad = prioridad;
    }

    public EstadoIncidencia getEstado() {
        return estado;
    }

    public void setEstado(EstadoIncidencia estado) {
        this.estado = estado;
    }

    public OffsetDateTime getFechaReporte() {
        return fechaReporte;
    }

    public void setFechaReporte(OffsetDateTime fechaReporte) {
        this.fechaReporte = fechaReporte;
    }
}

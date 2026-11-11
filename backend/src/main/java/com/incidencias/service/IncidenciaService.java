package com.incidencias.service;

import static com.incidencias.constants.Constants.ASIGNACION_POR_ENDPOINT;
import static com.incidencias.constants.Constants.ESTADO_FINAL;
import static com.incidencias.constants.Constants.INCIDENCIA_AJENA;
import static com.incidencias.constants.Constants.INCIDENCIA_NO_ENCONTRADA;
import static com.incidencias.constants.Constants.NO_ES_TECNICO_ASIGNADO;
import static com.incidencias.constants.Constants.SOLO_REPORTADA_SE_ASIGNA;
import static com.incidencias.constants.Constants.TECNICO_INVALIDO;
import static com.incidencias.constants.Constants.TRANSICION_INVALIDA;
import static com.incidencias.constants.Constants.UBICACION_NO_ENCONTRADA;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Objects;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.incidencias.dto.AsignacionRequestDto;
import com.incidencias.dto.CambioEstadoRequestDto;
import com.incidencias.dto.HistorialResponseDto;
import com.incidencias.dto.IncidenciaRequestDto;
import com.incidencias.dto.IncidenciaResponseDto;
import com.incidencias.enums.EstadoIncidencia;
import com.incidencias.enums.Rol;
import com.incidencias.exception.BusinessException;
import com.incidencias.model.HistorialEstadoModel;
import com.incidencias.model.IncidenciaModel;
import com.incidencias.model.UbicacionModel;
import com.incidencias.model.UsuarioModel;
import com.incidencias.repository.HistorialEstadoRepository;
import com.incidencias.repository.IncidenciaRepository;
import com.incidencias.repository.UbicacionRepository;
import com.incidencias.repository.UsuarioRepository;
import com.incidencias.util.DatetimeUtil;

/**
 * Concentra las reglas del caso: estado inicial (RN2), asignación (RN3), máquina de estados (RN4),
 * técnico dueño (RN5), historial en la misma transacción (RN6) y visibilidad por rol (RN7).
 */
@Service
public class IncidenciaService {

    private final IncidenciaRepository incidenciaRepository;
    private final HistorialEstadoRepository historialRepository;
    private final UbicacionRepository ubicacionRepository;
    private final UsuarioRepository usuarioRepository;

    public IncidenciaService(IncidenciaRepository incidenciaRepository,
            HistorialEstadoRepository historialRepository,
            UbicacionRepository ubicacionRepository,
            UsuarioRepository usuarioRepository) {
        this.incidenciaRepository = incidenciaRepository;
        this.historialRepository = historialRepository;
        this.ubicacionRepository = ubicacionRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional
    public IncidenciaResponseDto registrar(IncidenciaRequestDto dto, UsuarioModel reportante) {
        UbicacionModel ubicacion = ubicacionRepository.findById(dto.ubicacionId())
                .orElseThrow(() -> BusinessException.of(UBICACION_NO_ENCONTRADA, HttpStatus.UNPROCESSABLE_CONTENT));

        OffsetDateTime ahora = DatetimeUtil.ahora();
        IncidenciaModel incidencia = new IncidenciaModel();
        incidencia.setUbicacion(ubicacion);
        incidencia.setReportante(reportante);
        incidencia.setCategoria(dto.categoria());
        incidencia.setDescripcion(dto.descripcion());
        incidencia.setPrioridad(dto.prioridad());
        incidencia.setEstado(EstadoIncidencia.REPORTADA);
        incidencia.setFechaReporte(ahora);
        incidencia = incidenciaRepository.save(incidencia);

        registrarHistorial(incidencia, reportante, null, EstadoIncidencia.REPORTADA, null, ahora);
        return incidencia.toDto();
    }

    @Transactional(readOnly = true)
    public List<IncidenciaResponseDto> listar(UsuarioModel actual, EstadoIncidencia estado) {
        Long reportanteId = actual.getRol() == Rol.USUARIO ? actual.getId() : null;
        Long tecnicoId = actual.getRol() == Rol.TECNICO ? actual.getId() : null;
        return incidenciaRepository.buscar(reportanteId, tecnicoId, estado).stream()
                .map(IncidenciaModel::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public IncidenciaResponseDto findById(Long id, UsuarioModel actual) {
        return obtenerVisible(id, actual).toDto();
    }

    @Transactional(readOnly = true)
    public List<HistorialResponseDto> historial(Long id, UsuarioModel actual) {
        obtenerVisible(id, actual);
        return historialRepository.findByIncidenciaIdOrderByFechaAscIdAsc(id).stream()
                .map(HistorialEstadoModel::toDto)
                .toList();
    }

    @Transactional
    public IncidenciaResponseDto asignar(Long id, AsignacionRequestDto dto, UsuarioModel coordinador) {
        IncidenciaModel incidencia = obtenerParaActualizar(id);
        if (incidencia.getEstado() != EstadoIncidencia.REPORTADA) {
            throw BusinessException.of(SOLO_REPORTADA_SE_ASIGNA, HttpStatus.CONFLICT);
        }
        UsuarioModel tecnico = usuarioRepository.findById(dto.tecnicoId())
                .filter(u -> u.getRol() == Rol.TECNICO)
                .orElseThrow(() -> BusinessException.of(TECNICO_INVALIDO, HttpStatus.UNPROCESSABLE_CONTENT));

        incidencia.setTecnico(tecnico);
        incidencia.setEstado(EstadoIncidencia.ASIGNADA);
        String comentario = textoOpcional(dto.comentario());
        registrarHistorial(incidencia, coordinador, EstadoIncidencia.REPORTADA, EstadoIncidencia.ASIGNADA,
                comentario != null ? comentario : "Asignada a " + tecnico.getNombre(), DatetimeUtil.ahora());
        return incidencia.toDto();
    }

    @Transactional
    public IncidenciaResponseDto cambiarEstado(Long id, CambioEstadoRequestDto dto, UsuarioModel tecnico) {
        IncidenciaModel incidencia = obtenerParaActualizar(id);
        if (incidencia.getTecnico() == null || !Objects.equals(incidencia.getTecnico().getId(), tecnico.getId())) {
            throw BusinessException.of(NO_ES_TECNICO_ASIGNADO, HttpStatus.FORBIDDEN);
        }
        EstadoIncidencia actual = incidencia.getEstado();
        EstadoIncidencia siguiente = actual.siguiente();
        if (siguiente == null) {
            throw BusinessException.of(ESTADO_FINAL, HttpStatus.CONFLICT);
        }
        if (dto.estado() == EstadoIncidencia.ASIGNADA) {
            throw BusinessException.of(ASIGNACION_POR_ENDPOINT, HttpStatus.CONFLICT);
        }
        if (dto.estado() != siguiente) {
            throw BusinessException.of(TRANSICION_INVALIDA.formatted(actual, siguiente), HttpStatus.CONFLICT);
        }

        incidencia.setEstado(siguiente);
        registrarHistorial(incidencia, tecnico, actual, siguiente, textoOpcional(dto.comentario()),
                DatetimeUtil.ahora());
        return incidencia.toDto();
    }

    private IncidenciaModel obtener(Long id) {
        return incidenciaRepository.findById(id)
                .orElseThrow(() -> BusinessException.of(INCIDENCIA_NO_ENCONTRADA, HttpStatus.NOT_FOUND));
    }

    /** Bloquea la fila hasta el fin de la transacción para que dos cambios simultáneos no pasen la misma regla. */
    private IncidenciaModel obtenerParaActualizar(Long id) {
        return incidenciaRepository.findByIdParaActualizar(id)
                .orElseThrow(() -> BusinessException.of(INCIDENCIA_NO_ENCONTRADA, HttpStatus.NOT_FOUND));
    }

    /** RN7 aplicada al detalle: el usuario solo ve las suyas y el técnico solo las que tiene asignadas. */
    private IncidenciaModel obtenerVisible(Long id, UsuarioModel actual) {
        IncidenciaModel incidencia = obtener(id);
        boolean visible = switch (actual.getRol()) {
            case COORDINADOR -> true;
            case USUARIO -> Objects.equals(incidencia.getReportante().getId(), actual.getId());
            case TECNICO -> incidencia.getTecnico() != null
                    && Objects.equals(incidencia.getTecnico().getId(), actual.getId());
        };
        if (!visible) {
            throw BusinessException.of(INCIDENCIA_AJENA, HttpStatus.FORBIDDEN);
        }
        return incidencia;
    }

    private void registrarHistorial(IncidenciaModel incidencia, UsuarioModel usuario, EstadoIncidencia anterior,
            EstadoIncidencia nuevo, String comentario, OffsetDateTime fecha) {
        historialRepository.save(HistorialEstadoModel.de(incidencia, usuario, anterior, nuevo, comentario, fecha));
    }

    private static String textoOpcional(String texto) {
        return texto == null || texto.isBlank() ? null : texto.trim();
    }
}

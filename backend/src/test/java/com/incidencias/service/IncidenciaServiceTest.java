package com.incidencias.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import com.incidencias.dto.AsignacionRequestDto;
import com.incidencias.dto.CambioEstadoRequestDto;
import com.incidencias.dto.IncidenciaRequestDto;
import com.incidencias.dto.IncidenciaResponseDto;
import com.incidencias.enums.Categoria;
import com.incidencias.enums.EstadoIncidencia;
import com.incidencias.enums.Prioridad;
import com.incidencias.enums.Rol;
import com.incidencias.enums.TipoUbicacion;
import com.incidencias.exception.BusinessException;
import com.incidencias.model.HistorialEstadoModel;
import com.incidencias.model.IncidenciaModel;
import com.incidencias.model.UbicacionModel;
import com.incidencias.model.UsuarioModel;
import com.incidencias.repository.HistorialEstadoRepository;
import com.incidencias.repository.IncidenciaRepository;
import com.incidencias.repository.UbicacionRepository;
import com.incidencias.repository.UsuarioRepository;

@ExtendWith(MockitoExtension.class)
class IncidenciaServiceTest {

    @Mock
    private IncidenciaRepository incidenciaRepository;
    @Mock
    private HistorialEstadoRepository historialRepository;
    @Mock
    private UbicacionRepository ubicacionRepository;
    @Mock
    private UsuarioRepository usuarioRepository;

    @InjectMocks
    private IncidenciaService service;

    private UsuarioModel ana;
    private UsuarioModel carlos;
    private UsuarioModel diana;
    private UsuarioModel elena;
    private UbicacionModel lab;

    @BeforeEach
    void setUp() {
        ana = usuario(1L, "Ana López", Rol.USUARIO);
        carlos = usuario(3L, "Carlos Méndez", Rol.TECNICO);
        diana = usuario(4L, "Diana Ruiz", Rol.TECNICO);
        elena = usuario(5L, "Elena Salazar", Rol.COORDINADOR);
        lab = new UbicacionModel();
        lab.setId(3L);
        lab.setEdificio("Edificio B");
        lab.setNombre("Laboratorio de Cómputo 3");
        lab.setTipo(TipoUbicacion.LABORATORIO);
    }

    @Test
    @DisplayName("RN2 + RN6: una incidencia nueva nace REPORTADA y deja su primera fila de historial")
    void registrarIniciaComoReportada() {
        when(ubicacionRepository.findById(3L)).thenReturn(Optional.of(lab));
        when(incidenciaRepository.save(any())).thenAnswer(inv -> {
            IncidenciaModel i = inv.getArgument(0);
            i.setId(10L);
            return i;
        });

        IncidenciaResponseDto dto = service.registrar(
                new IncidenciaRequestDto(3L, Categoria.EQUIPO_COMPUTO, "  El proyector no enciende  ", Prioridad.ALTA),
                ana);

        assertThat(dto.estado()).isEqualTo(EstadoIncidencia.REPORTADA);
        assertThat(dto.descripcion()).isEqualTo("El proyector no enciende");
        assertThat(dto.tecnico()).isNull();
        HistorialEstadoModel h = historialCapturado();
        assertThat(h.getEstadoAnterior()).isNull();
        assertThat(h.getEstadoNuevo()).isEqualTo(EstadoIncidencia.REPORTADA);
        assertThat(h.getRealizadoPor()).isSameAs(ana);
    }

    @Test
    @DisplayName("Registrar con una ubicación inexistente responde 422 y no guarda nada")
    void registrarConUbicacionInexistente() {
        when(ubicacionRepository.findById(99L)).thenReturn(Optional.empty());

        assertError(() -> service.registrar(
                new IncidenciaRequestDto(99L, Categoria.OTRA, "Descripción suficiente", Prioridad.BAJA), ana),
                HttpStatus.UNPROCESSABLE_CONTENT);
        verify(incidenciaRepository, never()).save(any());
    }

    @Test
    @DisplayName("RN3: asignar pasa de REPORTADA a ASIGNADA y registra quién asignó")
    void asignarTecnico() {
        IncidenciaModel inc = incidencia(EstadoIncidencia.REPORTADA, null);
        when(incidenciaRepository.findByIdParaActualizar(10L)).thenReturn(Optional.of(inc));
        when(usuarioRepository.findById(3L)).thenReturn(Optional.of(carlos));

        IncidenciaResponseDto dto = service.asignar(10L, new AsignacionRequestDto(3L, null), elena);

        assertThat(dto.estado()).isEqualTo(EstadoIncidencia.ASIGNADA);
        assertThat(dto.tecnico().id()).isEqualTo(3L);
        HistorialEstadoModel h = historialCapturado();
        assertThat(h.getEstadoAnterior()).isEqualTo(EstadoIncidencia.REPORTADA);
        assertThat(h.getRealizadoPor()).isSameAs(elena);
        assertThat(h.getComentario()).isEqualTo("Asignada a Carlos Méndez");
    }

    @Test
    @DisplayName("RN3: no se asigna a alguien que no es técnico (422)")
    void asignarANoTecnico() {
        when(incidenciaRepository.findByIdParaActualizar(10L)).thenReturn(Optional.of(incidencia(EstadoIncidencia.REPORTADA, null)));
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(ana));

        assertError(() -> service.asignar(10L, new AsignacionRequestDto(1L, null), elena),
                HttpStatus.UNPROCESSABLE_CONTENT);
    }

    @Test
    @DisplayName("RN3: no hay reasignación; una incidencia ya ASIGNADA responde 409")
    void noSeReasigna() {
        when(incidenciaRepository.findByIdParaActualizar(10L)).thenReturn(Optional.of(incidencia(EstadoIncidencia.ASIGNADA, carlos)));

        assertError(() -> service.asignar(10L, new AsignacionRequestDto(4L, null), elena), HttpStatus.CONFLICT);
    }

    @Test
    @DisplayName("RN4: el técnico avanza ASIGNADA → EN_PROCESO → RESUELTA")
    void avanzarEstados() {
        IncidenciaModel inc = incidencia(EstadoIncidencia.ASIGNADA, carlos);
        when(incidenciaRepository.findByIdParaActualizar(10L)).thenReturn(Optional.of(inc));

        assertThat(service.cambiarEstado(10L, new CambioEstadoRequestDto(EstadoIncidencia.EN_PROCESO, null), carlos)
                .estado()).isEqualTo(EstadoIncidencia.EN_PROCESO);
        assertThat(service.cambiarEstado(10L,
                new CambioEstadoRequestDto(EstadoIncidencia.RESUELTA, "Se cambió la lámpara"), carlos)
                .estado()).isEqualTo(EstadoIncidencia.RESUELTA);
    }

    @Test
    @DisplayName("RN4: saltar de ASIGNADA a RESUELTA responde 409")
    void noSeSaltanEstados() {
        when(incidenciaRepository.findByIdParaActualizar(10L)).thenReturn(Optional.of(incidencia(EstadoIncidencia.ASIGNADA, carlos)));

        assertError(() -> service.cambiarEstado(10L,
                new CambioEstadoRequestDto(EstadoIncidencia.RESUELTA, null), carlos), HttpStatus.CONFLICT);
    }

    @Test
    @DisplayName("RN4: una incidencia RESUELTA ya no cambia (409)")
    void resueltaEsFinal() {
        when(incidenciaRepository.findByIdParaActualizar(10L)).thenReturn(Optional.of(incidencia(EstadoIncidencia.RESUELTA, carlos)));

        assertError(() -> service.cambiarEstado(10L,
                new CambioEstadoRequestDto(EstadoIncidencia.EN_PROCESO, null), carlos), HttpStatus.CONFLICT);
    }

    @Test
    @DisplayName("RN5: otro técnico no puede cambiar el estado (403)")
    void soloElTecnicoAsignado() {
        when(incidenciaRepository.findByIdParaActualizar(10L)).thenReturn(Optional.of(incidencia(EstadoIncidencia.ASIGNADA, carlos)));

        assertError(() -> service.cambiarEstado(10L,
                new CambioEstadoRequestDto(EstadoIncidencia.EN_PROCESO, null), diana), HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("RN7: un usuario no ve el detalle de una incidencia ajena (403)")
    void usuarioNoVeAjenas() {
        UsuarioModel bruno = usuario(2L, "Bruno Ortega", Rol.USUARIO);
        when(incidenciaRepository.findById(10L)).thenReturn(Optional.of(incidencia(EstadoIncidencia.REPORTADA, null)));

        assertError(() -> service.findById(10L, bruno), HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("RN4: el enum solo conoce un sucesor por estado")
    void siguienteEstado() {
        assertThat(EstadoIncidencia.REPORTADA.siguiente()).isEqualTo(EstadoIncidencia.ASIGNADA);
        assertThat(EstadoIncidencia.ASIGNADA.siguiente()).isEqualTo(EstadoIncidencia.EN_PROCESO);
        assertThat(EstadoIncidencia.EN_PROCESO.siguiente()).isEqualTo(EstadoIncidencia.RESUELTA);
        assertThat(EstadoIncidencia.RESUELTA.siguiente()).isNull();
    }

    private HistorialEstadoModel historialCapturado() {
        ArgumentCaptor<HistorialEstadoModel> captor = ArgumentCaptor.forClass(HistorialEstadoModel.class);
        verify(historialRepository).save(captor.capture());
        return captor.getValue();
    }

    private static void assertError(org.assertj.core.api.ThrowableAssert.ThrowingCallable call, HttpStatus status) {
        assertThatThrownBy(call)
                .isInstanceOf(BusinessException.class)
                .satisfies(e -> assertThat(((BusinessException) e).getErrorMessageDto().httpStatus())
                        .isEqualTo(status));
    }

    private IncidenciaModel incidencia(EstadoIncidencia estado, UsuarioModel tecnico) {
        IncidenciaModel i = new IncidenciaModel();
        i.setId(10L);
        i.setUbicacion(lab);
        i.setReportante(ana);
        i.setTecnico(tecnico);
        i.setCategoria(Categoria.ELECTRICA);
        i.setDescripcion("Lámpara fundida en el laboratorio");
        i.setPrioridad(Prioridad.MEDIA);
        i.setEstado(estado);
        i.setFechaReporte(com.incidencias.util.DatetimeUtil.ahora());
        return i;
    }

    private static UsuarioModel usuario(Long id, String nombre, Rol rol) {
        UsuarioModel u = new UsuarioModel();
        u.setId(id);
        u.setNombre(nombre);
        u.setUsername(nombre.split(" ")[0].toLowerCase());
        u.setRol(rol);
        return u;
    }
}

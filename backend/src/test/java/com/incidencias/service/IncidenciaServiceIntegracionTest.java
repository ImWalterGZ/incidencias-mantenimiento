package com.incidencias.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.doThrow;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import com.incidencias.dto.AsignacionRequestDto;
import com.incidencias.dto.IncidenciaRequestDto;
import com.incidencias.dto.IncidenciaResponseDto;
import com.incidencias.enums.Categoria;
import com.incidencias.enums.EstadoIncidencia;
import com.incidencias.enums.Prioridad;
import com.incidencias.exception.BusinessException;
import com.incidencias.model.UsuarioModel;
import com.incidencias.repository.HistorialEstadoRepository;
import com.incidencias.repository.UsuarioRepository;

/**
 * Pruebas contra PostgreSQL real (el de compose.yaml, puerto 5433), con transacciones de Spring.
 * Cubren lo que Mockito no puede demostrar: el rollback conjunto (RNF2) y la concurrencia sobre RN3.
 */
@SpringBootTest
class IncidenciaServiceIntegracionTest {

    @Autowired
    private IncidenciaService service;
    @Autowired
    private UsuarioRepository usuarioRepository;
    @MockitoSpyBean
    private HistorialEstadoRepository historialRepository;
    @Autowired
    private PlatformTransactionManager transactionManager;
    private TransactionTemplate transaccion;

    private UsuarioModel ana;
    private UsuarioModel carlos;
    private UsuarioModel diana;
    private UsuarioModel elena;

    @BeforeEach
    void setUp() {
        transaccion = new TransactionTemplate(transactionManager);
        ana = usuarioRepository.findByUsername("ana").orElseThrow();
        carlos = usuarioRepository.findByUsername("carlos").orElseThrow();
        diana = usuarioRepository.findByUsername("diana").orElseThrow();
        elena = usuarioRepository.findByUsername("elena").orElseThrow();
    }

    @Test
    @DisplayName("RNF2: si falla el historial, la asignación se revierte completa")
    void rollbackConjunto() {
        Long id = registrar("Prueba de integración: rollback de la asignación").id();
        doThrow(new IllegalStateException("falla simulada del historial"))
                .when(historialRepository).save(argThat(h -> h.getEstadoNuevo() == EstadoIncidencia.ASIGNADA));

        assertThatThrownBy(() -> service.asignar(id, new AsignacionRequestDto(carlos.getId(), null), elena))
                .isInstanceOf(IllegalStateException.class);

        IncidenciaResponseDto despues = service.findById(id, elena);
        assertThat(despues.estado()).isEqualTo(EstadoIncidencia.REPORTADA);
        assertThat(despues.tecnico()).isNull();
        assertThat(service.historial(id, elena)).hasSize(1);
    }

    @Test
    @DisplayName("RN3 con concurrencia: de dos asignaciones simultáneas solo una gana; la otra recibe 409")
    void asignacionesSimultaneas() throws Exception {
        Long id = registrar("Prueba de integración: dos asignaciones al mismo tiempo").id();
        CountDownLatch primeraTieneLaFila = new CountDownLatch(1);
        ExecutorService pool = Executors.newFixedThreadPool(2);

        // Hilo 1: asigna a Carlos dentro de una transacción que tarda en confirmar.
        Future<IncidenciaResponseDto> primera = pool.submit(() -> transaccion.execute(estado -> {
            IncidenciaResponseDto r = service.asignar(id, new AsignacionRequestDto(carlos.getId(), null), elena);
            primeraTieneLaFila.countDown();
            dormir(500);
            return r;
        }));
        // Hilo 2: intenta asignar a Diana mientras la primera transacción sigue abierta.
        primeraTieneLaFila.await();
        Future<IncidenciaResponseDto> segunda = pool.submit(
                () -> service.asignar(id, new AsignacionRequestDto(diana.getId(), null), elena));

        assertThat(primera.get().tecnico().id()).isEqualTo(carlos.getId());
        assertThatThrownBy(segunda::get)
                .hasCauseInstanceOf(BusinessException.class)
                .satisfies(e -> assertThat(((BusinessException) e.getCause()).getErrorMessageDto().httpStatus())
                        .isEqualTo(HttpStatus.CONFLICT));
        pool.shutdown();

        assertThat(service.findById(id, elena).tecnico().id()).isEqualTo(carlos.getId());
        assertThat(service.historial(id, elena))
                .extracting(h -> h.estadoNuevo())
                .containsExactly(EstadoIncidencia.REPORTADA, EstadoIncidencia.ASIGNADA);
    }

    private static void dormir(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private IncidenciaResponseDto registrar(String descripcion) {
        return service.registrar(new IncidenciaRequestDto(1L, Categoria.OTRA, descripcion, Prioridad.BAJA), ana);
    }
}

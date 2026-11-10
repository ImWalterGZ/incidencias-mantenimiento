package com.incidencias.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.incidencias.dto.UbicacionResponseDto;
import com.incidencias.model.UbicacionModel;
import com.incidencias.repository.UbicacionRepository;

@Service
public class UbicacionService {

    private final UbicacionRepository ubicacionRepository;

    public UbicacionService(UbicacionRepository ubicacionRepository) {
        this.ubicacionRepository = ubicacionRepository;
    }

    @Transactional(readOnly = true)
    public List<UbicacionResponseDto> findAll() {
        return ubicacionRepository.findAllByOrderByEdificioAscNombreAsc().stream()
                .map(UbicacionModel::toDto)
                .toList();
    }
}

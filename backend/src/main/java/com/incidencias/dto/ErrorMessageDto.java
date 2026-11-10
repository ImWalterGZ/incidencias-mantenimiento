package com.incidencias.dto;

import java.util.Map;

import org.springframework.http.HttpStatus;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorMessageDto(String message, HttpStatus httpStatus, long timestamp, Map<String, String> campos) {

    public ErrorMessageDto(String message, HttpStatus httpStatus, long timestamp) {
        this(message, httpStatus, timestamp, null);
    }
}

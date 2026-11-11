package com.incidencias.exception;

import java.util.LinkedHashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import com.incidencias.constants.Constants;
import com.incidencias.dto.ErrorMessageDto;
import com.incidencias.util.DatetimeUtil;

/** Traduce cada falla a un ErrorMessageDto con su código HTTP (RNF5). */
@ControllerAdvice
public class ExceptionHandler {

    private static final Logger LOG = LoggerFactory.getLogger(ExceptionHandler.class);

    @org.springframework.web.bind.annotation.ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorMessageDto> businessExceptionHandler(BusinessException e) {
        return new ResponseEntity<>(e.getErrorMessageDto(), e.getErrorMessageDto().httpStatus());
    }

    @org.springframework.web.bind.annotation.ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorMessageDto> validationHandler(MethodArgumentNotValidException e) {
        Map<String, String> campos = new LinkedHashMap<>();
        e.getBindingResult().getFieldErrors()
                .forEach(fe -> campos.putIfAbsent(fe.getField(), fe.getDefaultMessage()));
        return error(Constants.DATOS_INVALIDOS, HttpStatus.BAD_REQUEST, campos);
    }

    @org.springframework.web.bind.annotation.ExceptionHandler({HttpMessageNotReadableException.class,
            MethodArgumentTypeMismatchException.class, MissingServletRequestParameterException.class})
    public ResponseEntity<ErrorMessageDto> unreadableHandler(Exception e) {
        return error(Constants.DATOS_INVALIDOS, HttpStatus.BAD_REQUEST, null);
    }

    @org.springframework.web.bind.annotation.ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorMessageDto> badCredentialsHandler(BadCredentialsException e) {
        return error(Constants.CREDENCIALES_INVALIDAS, HttpStatus.UNAUTHORIZED, null);
    }

    @org.springframework.web.bind.annotation.ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorMessageDto> accessDeniedHandler(AccessDeniedException e) {
        return error(Constants.ACCESO_DENEGADO, HttpStatus.FORBIDDEN, null);
    }

    /** Cualquier falla no prevista responde 500 con un mensaje genérico, sin detalles internos. */
    @org.springframework.web.bind.annotation.ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorMessageDto> genericHandler(Exception e) {
        LOG.error("Error no controlado", e);
        return error(Constants.ERROR_INTERNO, HttpStatus.INTERNAL_SERVER_ERROR, null);
    }

    private ResponseEntity<ErrorMessageDto> error(String message, HttpStatus status, Map<String, String> campos) {
        return new ResponseEntity<>(
                new ErrorMessageDto(message, status, DatetimeUtil.getTimestampInMilliseconds(), campos), status);
    }
}

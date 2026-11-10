package com.incidencias.exception;

import org.springframework.http.HttpStatus;

import com.incidencias.dto.ErrorMessageDto;
import com.incidencias.util.DatetimeUtil;

public class BusinessException extends RuntimeException {

    private final ErrorMessageDto errorMessageDto;

    public BusinessException(ErrorMessageDto errorMessageDto) {
        super(errorMessageDto.message());
        this.errorMessageDto = errorMessageDto;
    }

    public static BusinessException of(String message, HttpStatus status) {
        return new BusinessException(
                new ErrorMessageDto(message, status, DatetimeUtil.getTimestampInMilliseconds()));
    }

    public ErrorMessageDto getErrorMessageDto() {
        return errorMessageDto;
    }
}

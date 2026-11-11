package com.incidencias.constants;

public final class Constants {

    public static final String ROLE_PREFIX = "ROLE_";

    public static final String CREDENCIALES_INVALIDAS = "Usuario o contraseña incorrectos";
    public static final String NO_AUTENTICADO = "Se requiere iniciar sesión";
    public static final String ACCESO_DENEGADO = "No tienes permiso para esta operación";
    public static final String DATOS_INVALIDOS = "Datos inválidos";
    public static final String ERROR_INTERNO = "Ocurrió un error inesperado; intenta de nuevo";
    /** Texto libre sin byte nulo, que PostgreSQL no acepta en columnas de texto. Los saltos de línea sí se permiten. */
    public static final String TEXTO_SIN_NULOS = "[^\\x00]*";

    public static final String INCIDENCIA_NO_ENCONTRADA = "La incidencia no existe";
    public static final String INCIDENCIA_AJENA = "La incidencia no te corresponde";
    public static final String UBICACION_NO_ENCONTRADA = "La ubicación no existe";
    public static final String TECNICO_INVALIDO = "El usuario indicado no existe o no es técnico";
    public static final String SOLO_REPORTADA_SE_ASIGNA = "Solo una incidencia en estado REPORTADA puede asignarse";
    public static final String NO_ES_TECNICO_ASIGNADO = "Solo el técnico asignado puede actualizar el estado";
    public static final String TRANSICION_INVALIDA = "Transición inválida: de %s solo se puede pasar a %s";
    public static final String ESTADO_FINAL = "La incidencia ya está RESUELTA y no admite más cambios";
    public static final String ASIGNACION_POR_ENDPOINT = "El paso a ASIGNADA se hace con el endpoint de asignación";

    private Constants() {
    }
}

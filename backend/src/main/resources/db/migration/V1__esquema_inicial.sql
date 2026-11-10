-- Esquema del Caso 3: control de incidencias de mantenimiento.
-- Corresponde a docs/uml/04-entidad-relacion.puml.

CREATE TABLE usuario (
    id            BIGSERIAL PRIMARY KEY,
    nombre        VARCHAR(120) NOT NULL,
    username      VARCHAR(60)  NOT NULL UNIQUE,
    password_hash VARCHAR(100) NOT NULL,
    rol           VARCHAR(20)  NOT NULL CHECK (rol IN ('USUARIO', 'TECNICO', 'COORDINADOR'))
);

CREATE TABLE ubicacion (
    id       BIGSERIAL PRIMARY KEY,
    edificio VARCHAR(60)  NOT NULL,
    nombre   VARCHAR(120) NOT NULL,
    tipo     VARCHAR(20)  NOT NULL CHECK (tipo IN ('AULA', 'LABORATORIO', 'OFICINA')),
    UNIQUE (edificio, nombre)
);

CREATE TABLE incidencia (
    id            BIGSERIAL PRIMARY KEY,
    ubicacion_id  BIGINT        NOT NULL REFERENCES ubicacion (id),
    reportante_id BIGINT        NOT NULL REFERENCES usuario (id),
    tecnico_id    BIGINT        REFERENCES usuario (id),
    categoria     VARCHAR(30)   NOT NULL CHECK (categoria IN ('ELECTRICA', 'PLOMERIA', 'MOBILIARIO', 'EQUIPO_COMPUTO', 'CLIMATIZACION', 'OTRA')),
    descripcion   VARCHAR(1000) NOT NULL,
    prioridad     VARCHAR(10)   NOT NULL CHECK (prioridad IN ('BAJA', 'MEDIA', 'ALTA')),
    estado        VARCHAR(20)   NOT NULL CHECK (estado IN ('REPORTADA', 'ASIGNADA', 'EN_PROCESO', 'RESUELTA')),
    fecha_reporte TIMESTAMPTZ   NOT NULL DEFAULT now(),
    -- Una incidencia en Reportada no tiene técnico; en cualquier estado posterior sí (RN3).
    CONSTRAINT incidencia_tecnico_segun_estado CHECK ((estado = 'REPORTADA') = (tecnico_id IS NULL))
);

CREATE INDEX incidencia_reportante_idx ON incidencia (reportante_id);
CREATE INDEX incidencia_tecnico_idx ON incidencia (tecnico_id);
CREATE INDEX incidencia_estado_idx ON incidencia (estado);

CREATE TABLE historial_estado_incidencia (
    id              BIGSERIAL PRIMARY KEY,
    incidencia_id   BIGINT       NOT NULL REFERENCES incidencia (id),
    usuario_id      BIGINT       NOT NULL REFERENCES usuario (id),
    estado_anterior VARCHAR(20)  CHECK (estado_anterior IN ('REPORTADA', 'ASIGNADA', 'EN_PROCESO', 'RESUELTA')),
    estado_nuevo    VARCHAR(20)  NOT NULL CHECK (estado_nuevo IN ('REPORTADA', 'ASIGNADA', 'EN_PROCESO', 'RESUELTA')),
    comentario      VARCHAR(500),
    fecha           TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX historial_incidencia_idx ON historial_estado_incidencia (incidencia_id, fecha);

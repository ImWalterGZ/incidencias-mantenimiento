-- Ubicaciones precargadas (no hay pantalla para administrarlas: fuera de alcance).
INSERT INTO ubicacion (edificio, nombre, tipo) VALUES
    ('Edificio A', 'Aula A-101', 'AULA'),
    ('Edificio A', 'Aula A-204', 'AULA'),
    ('Edificio B', 'Laboratorio de Cómputo 3', 'LABORATORIO'),
    ('Edificio B', 'Laboratorio de Redes', 'LABORATORIO'),
    ('Edificio D', 'Servicios Escolares', 'OFICINA'),
    ('Edificio D', 'Coordinación de TI', 'OFICINA');

-- Usuarios de prueba; la contraseña de todos es Incidencias2026 (hash BCrypt).
INSERT INTO usuario (nombre, username, password_hash, rol) VALUES
    ('Ana López',       'ana',       '$2b$10$aEUqSX.AojZ2BtXECpY3g.tukaIRW/t3I67Tm1gm9.2l9bNcuHQ3q', 'USUARIO'),
    ('Bruno Ortega',    'bruno',     '$2b$10$aEUqSX.AojZ2BtXECpY3g.tukaIRW/t3I67Tm1gm9.2l9bNcuHQ3q', 'USUARIO'),
    ('Carlos Méndez',   'carlos',    '$2b$10$aEUqSX.AojZ2BtXECpY3g.tukaIRW/t3I67Tm1gm9.2l9bNcuHQ3q', 'TECNICO'),
    ('Diana Ruiz',      'diana',     '$2b$10$aEUqSX.AojZ2BtXECpY3g.tukaIRW/t3I67Tm1gm9.2l9bNcuHQ3q', 'TECNICO'),
    ('Elena Salazar',   'elena',     '$2b$10$aEUqSX.AojZ2BtXECpY3g.tukaIRW/t3I67Tm1gm9.2l9bNcuHQ3q', 'COORDINADOR');

-- ============================================================================
-- PROYECTO BUMAND — ESQUEMA MAESTRO DE BASE DE DATOS POSTGRESQL (15 TABLAS)
-- ============================================================================
-- Archivo: 001_esquema_completo_15_tablas.sql
-- Ubicación: bumand-backend/src/datos/
-- Descripción:
--   Definición DDL completa de las 15 tablas relacionales del sistema BUMAND
--   conforme al Documento de Diseño (RESUMEN_PROYECTO.md), el MER canónico
--   (Figura 3.22) y el modelo formal schema.prisma.
--
-- Estándar de nomenclatura:
--   - snake_case riguroso para tablas, columnas, restricciones e índices.
--   - Integridad referencial con llaves foráneas y eliminación en cascada/restringida.
--
-- Tablas incluidas (15):
--   01. usuarios
--   02. iglesias
--   03. lugares_practica
--   04. becarios
--   05. registros_asistencia
--   06. solicitudes_pasajes
--   07. recorridos
--   08. modulos_evaluacion
--   09. periodos_evaluacion
--   10. evaluadores
--   11. evaluaciones
--   12. evaluaciones_pastor
--   13. aprobaciones_practicas
--   14. notificaciones
--   15. reportes_generados
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. TIPOS ENUMERADOS (ENUMS)
-- ---------------------------------------------------------------------------

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rol_usuario') THEN
        CREATE TYPE rol_usuario AS ENUM ('becario', 'supervisor', 'administrador');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_usuario') THEN
        CREATE TYPE estado_usuario AS ENUM ('activo', 'inactivo');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_asistencia') THEN
        CREATE TYPE tipo_asistencia AS ENUM ('practicas', 'escuela_lideres', 'acciones_servicio');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_solicitud') THEN
        CREATE TYPE estado_solicitud AS ENUM ('borrador', 'pendiente', 'aprobado', 'rechazado');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tramo_recorrido') THEN
        CREATE TYPE tramo_recorrido AS ENUM ('ida', 'vuelta');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_evaluador') THEN
        CREATE TYPE tipo_evaluador AS ENUM ('pastor', 'becario', 'supervisor', 'facilitador', 'trabajador_social');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_periodo') THEN
        CREATE TYPE estado_periodo AS ENUM ('abierto', 'cerrado');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_evaluacion') THEN
        CREATE TYPE estado_evaluacion AS ENUM ('pendiente', 'completado');
    END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2. NÚCLEO INSTITUCIONAL Y DE USUARIOS (Tablas 1 - 4)
-- ---------------------------------------------------------------------------

-- Tabla 01: usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id                SERIAL PRIMARY KEY,
    nombre            VARCHAR(150)        NOT NULL,
    correo            VARCHAR(150)        NOT NULL UNIQUE,
    contrasena_hash   VARCHAR(255)        NOT NULL,
    rol               rol_usuario         NOT NULL,
    estado            estado_usuario      NOT NULL DEFAULT 'activo',
    fcm_token         VARCHAR(255),
    reset_codigo      VARCHAR(10),
    reset_expira      TIMESTAMP,
    created_at        TIMESTAMP           NOT NULL DEFAULT now()
);

-- Tabla 02: iglesias
CREATE TABLE IF NOT EXISTS iglesias (
    id                SERIAL PRIMARY KEY,
    nombre            VARCHAR(150)        NOT NULL,
    direccion         VARCHAR(255)
);

-- Tabla 03: lugares_practica
CREATE TABLE IF NOT EXISTS lugares_practica (
    id                    SERIAL PRIMARY KEY,
    nombre                VARCHAR(150)    NOT NULL,
    direccion             VARCHAR(255),
    latitud               DECIMAL(9,6)    NOT NULL,
    longitud              DECIMAL(9,6)    NOT NULL,
    radio_tolerancia_m    INTEGER         NOT NULL
);

-- Tabla 04: becarios
CREATE TABLE IF NOT EXISTS becarios (
    id                  SERIAL PRIMARY KEY,
    usuario_id          INTEGER         NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
    ci                  VARCHAR(20)     UNIQUE,
    carrera             VARCHAR(100)    NOT NULL,
    universidad         VARCHAR(150)    NOT NULL,
    institucion         VARCHAR(150),
    iglesia_id          INTEGER         REFERENCES iglesias(id) ON DELETE SET NULL,
    lugar_practica_id   INTEGER         REFERENCES lugares_practica(id) ON DELETE SET NULL,
    fecha_ingreso       DATE            NOT NULL,
    supervisor_id       INTEGER         REFERENCES usuarios(id) ON DELETE SET NULL,
    unidad              VARCHAR(100)
);

-- ---------------------------------------------------------------------------
-- 3. CONTROL DE ASISTENCIA Y GEOLOCALIZACIÓN (Tabla 5)
-- ---------------------------------------------------------------------------

-- Tabla 05: registros_asistencia
CREATE TABLE IF NOT EXISTS registros_asistencia (
    id                  SERIAL PRIMARY KEY,
    becario_id          INTEGER          NOT NULL REFERENCES becarios(id) ON DELETE CASCADE,
    tipo                tipo_asistencia  NOT NULL,
    fecha               DATE             NOT NULL,
    hora_ingreso        TIME,
    hora_salida         TIME,
    lat_ingreso         DECIMAL(9,6),
    lng_ingreso         DECIMAL(9,6),
    lat_salida          DECIMAL(9,6),
    lng_salida          DECIMAL(9,6),
    horas_trabajadas    DECIMAL(5,2),
    dentro_de_radio     BOOLEAN          NOT NULL DEFAULT false,
    dentro_de_horario   BOOLEAN,
    created_at          TIMESTAMP        NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_registros_asistencia_becario_fecha 
    ON registros_asistencia (becario_id, fecha);

-- ---------------------------------------------------------------------------
-- 4. GESTIÓN Y REINTEGRO DE PASAJES (Tablas 6 - 7)
-- ---------------------------------------------------------------------------

-- Tabla 06: solicitudes_pasajes
CREATE TABLE IF NOT EXISTS solicitudes_pasajes (
    id                 SERIAL PRIMARY KEY,
    becario_id         INTEGER            NOT NULL REFERENCES becarios(id) ON DELETE CASCADE,
    periodo            VARCHAR(20)        NOT NULL,
    monto_total        DECIMAL(8,2)       NOT NULL DEFAULT 0.00,
    monto_devolucion   DECIMAL(8,2)       NOT NULL DEFAULT 0.00,
    estado             estado_solicitud   NOT NULL DEFAULT 'borrador',
    observaciones      TEXT,
    supervisor_id      INTEGER            REFERENCES usuarios(id) ON DELETE SET NULL,
    datos_becario      JSONB,
    fecha_envio        TIMESTAMP,
    fecha_resolucion   TIMESTAMP,
    created_at         TIMESTAMP          NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_solicitudes_pasajes_becario_periodo 
    ON solicitudes_pasajes (becario_id, periodo);

-- Tabla 07: recorridos
CREATE TABLE IF NOT EXISTS recorridos (
    id                 SERIAL PRIMARY KEY,
    solicitud_id       INTEGER            NOT NULL REFERENCES solicitudes_pasajes(id) ON DELETE CASCADE,
    fecha              DATE               NOT NULL,
    tramo              tramo_recorrido    NOT NULL,
    origen             VARCHAR(150)       NOT NULL,
    destino            VARCHAR(150)       NOT NULL,
    tarifa             DECIMAL(6,2)       NOT NULL,
    lat_origen         DECIMAL(9,6),
    lng_origen         DECIMAL(9,6),
    lat_destino        DECIMAL(9,6),
    lng_destino        DECIMAL(9,6),
    apoyo_realizado    VARCHAR(255),
    created_at         TIMESTAMP          NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recorridos_solicitud_id 
    ON recorridos (solicitud_id);

-- ---------------------------------------------------------------------------
-- 5. SISTEMA DE EVALUACIÓN MULTI-ACTOR 360° (Tablas 8 - 12)
-- ---------------------------------------------------------------------------

-- Tabla 08: modulos_evaluacion
CREATE TABLE IF NOT EXISTS modulos_evaluacion (
    id                 SERIAL PRIMARY KEY,
    nombre             VARCHAR(100)       NOT NULL,
    descripcion        TEXT,
    orden              INTEGER            NOT NULL
);

-- Tabla 09: periodos_evaluacion
CREATE TABLE IF NOT EXISTS periodos_evaluacion (
    id                 SERIAL PRIMARY KEY,
    nombre             VARCHAR(50)        NOT NULL,
    fecha_inicio       DATE               NOT NULL,
    fecha_fin          DATE               NOT NULL,
    estado             estado_periodo     NOT NULL DEFAULT 'abierto'
);

-- Tabla 10: evaluadores
CREATE TABLE IF NOT EXISTS evaluadores (
    id                 SERIAL PRIMARY KEY,
    nombre             VARCHAR(150)       NOT NULL,
    tipo               tipo_evaluador     NOT NULL,
    correo             VARCHAR(150),
    telefono           VARCHAR(30)
);

-- Tabla 11: evaluaciones
CREATE TABLE IF NOT EXISTS evaluaciones (
    id                 SERIAL PRIMARY KEY,
    becario_id         INTEGER            NOT NULL REFERENCES becarios(id) ON DELETE CASCADE,
    periodo_id         INTEGER            NOT NULL REFERENCES periodos_evaluacion(id) ON DELETE RESTRICT,
    modulo_id          INTEGER            NOT NULL REFERENCES modulos_evaluacion(id) ON DELETE RESTRICT,
    evaluador_id       INTEGER            NOT NULL REFERENCES evaluadores(id) ON DELETE RESTRICT,
    puntaje            DECIMAL(5,2)       CHECK (puntaje >= 0 AND puntaje <= 100),
    estado             estado_evaluacion  NOT NULL DEFAULT 'pendiente',
    observaciones      TEXT,
    archivo_pdf        VARCHAR(255),
    fecha_evaluacion   DATE,
    created_at         TIMESTAMP          NOT NULL DEFAULT now(),
    CONSTRAINT uq_evaluacion_becario_periodo_modulo UNIQUE (becario_id, periodo_id, modulo_id)
);

CREATE INDEX IF NOT EXISTS idx_evaluaciones_becario_periodo 
    ON evaluaciones (becario_id, periodo_id);

-- Tabla 12: evaluaciones_pastor (Extensión 1:1 F-03 para el módulo de Liderazgo)
CREATE TABLE IF NOT EXISTS evaluaciones_pastor (
    id                  SERIAL PRIMARY KEY,
    evaluacion_id       INTEGER            NOT NULL UNIQUE REFERENCES evaluaciones(id) ON DELETE CASCADE,
    pastor_nombre       VARCHAR(150)       NOT NULL,
    pastor_correo       VARCHAR(150),
    pastor_celular      VARCHAR(30),
    iglesia_nombre      VARCHAR(150)       NOT NULL,
    iglesia_direccion   VARCHAR(255),
    campos_formulario   JSONB,
    fecha               DATE               NOT NULL DEFAULT CURRENT_DATE
);

-- ---------------------------------------------------------------------------
-- 6. SUPERVISIÓN DE PRÁCTICAS Y FIRMA DIGITAL (Tabla 13)
-- ---------------------------------------------------------------------------

-- Tabla 13: aprobaciones_practicas
CREATE TABLE IF NOT EXISTS aprobaciones_practicas (
    id                  SERIAL PRIMARY KEY,
    becario_id          INTEGER            NOT NULL REFERENCES becarios(id) ON DELETE CASCADE,
    supervisor_id       INTEGER            NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    periodo             VARCHAR(20)        NOT NULL,
    horas_aprobadas     DECIMAL(6,2)       NOT NULL,
    firma_digital       TEXT               NOT NULL,
    observaciones       TEXT,
    created_at          TIMESTAMP          NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_aprobaciones_practicas_becario_periodo 
    ON aprobaciones_practicas (becario_id, periodo);

-- ---------------------------------------------------------------------------
-- 7. NOTIFICACIONES Y REPORTES HISTÓRICOS (Tablas 14 - 15)
-- ---------------------------------------------------------------------------

-- Tabla 14: notificaciones
CREATE TABLE IF NOT EXISTS notificaciones (
    id                  SERIAL PRIMARY KEY,
    usuario_id          INTEGER            NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo                VARCHAR(50)        NOT NULL,
    mensaje             TEXT               NOT NULL,
    leido               BOOLEAN            NOT NULL DEFAULT false,
    fecha_envio         TIMESTAMP          NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario_leido 
    ON notificaciones (usuario_id, leido);

-- Tabla 15: reportes_generados
CREATE TABLE IF NOT EXISTS reportes_generados (
    id                  SERIAL PRIMARY KEY,
    becario_id          INTEGER            NOT NULL REFERENCES becarios(id) ON DELETE CASCADE,
    periodo             VARCHAR(20)        NOT NULL,
    url_pdf             VARCHAR(255)       NOT NULL,
    fecha_generacion    TIMESTAMP          NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reportes_generados_becario_periodo 
    ON reportes_generados (becario_id, periodo);

-- ---------------------------------------------------------------------------
-- 8. DATOS SEMILLA BASE (SEEDING)
-- ---------------------------------------------------------------------------

-- Catálogo oficial de los 5 Módulos de Evaluación (Figura 3.22)
INSERT INTO modulos_evaluacion (id, nombre, descripcion, orden) VALUES
    (1, 'Liderazgo en la Iglesia',        'Evaluación realizada por el pastor de la congregación (formulario F-03)', 1),
    (2, 'Autoevaluación Académica',       'Autoevaluación del becario sobre su desempeño y avance universitario', 2),
    (3, 'Evaluación del Mentor',          'Evaluación cualitativa y cuantitativa por el supervisor/mentor asignado', 3),
    (4, 'Evaluación Escuela de Líderes',  'Evaluación del facilitador sobre la participación formativa diaconal', 4),
    (5, 'Evaluación Socioeconómica',      'Evaluación y seguimiento periódico por trabajo social institucional', 5)
ON CONFLICT (id) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    orden = EXCLUDED.orden;

SELECT setval('modulos_evaluacion_id_seq', (SELECT MAX(id) FROM modulos_evaluacion));

-- Periodos de evaluación base
INSERT INTO periodos_evaluacion (id, nombre, fecha_inicio, fecha_fin, estado) VALUES
    (1, 'Semestre I - 2026',  '2026-01-01', '2026-06-30', 'cerrado'),
    (2, 'Semestre II - 2026', '2026-07-01', '2026-12-31', 'abierto')
ON CONFLICT (id) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    fecha_inicio = EXCLUDED.fecha_inicio,
    fecha_fin = EXCLUDED.fecha_fin,
    estado = EXCLUDED.estado;

SELECT setval('periodos_evaluacion_id_seq', (SELECT MAX(id) FROM periodos_evaluacion));

COMMIT;

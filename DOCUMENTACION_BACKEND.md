# Manual de Arquitectura Técnica y Especificación del Backend (BUMAND API)

---

## 1. Fundamentos Arquitectónicos y Filosofía del Sistema

El ecosistema tecnológico BUMAND constituye la plataforma unificada para la gestión, acompañamiento y evaluación integral del Programa de Becarios Universitarios impulsado por la **Fundación Diaconía Fondo Rotativo de Inversión y Fomento (Diaconía FRIF-IFD)**. Históricamente, la administración de programas de becas y servicio comunitario ha dependido de procesos documentales analógicos: planillas de asistencia en papel físico, declaraciones juradas de gastos manuscritas con cálculo empírico de transporte, y formularios de evaluación pastoral enviados por correo postal o mensajería informal. Esta dinámica introducía una fricción operativa notable, propiciaba márgenes de error en liquidaciones monetarias y dilataba los tiempos de respuesta institucional.

Para resolver esta problemática con un estándar de ingeniería de nivel empresarial, el backend de BUMAND ha sido rediseñado como un **monolito modular altamente cohesivo y desacoplado**, construido sobre la plataforma **NestJS 11** y **TypeScript 5.9**, empleando **TypeORM 1.1** sobre un motor relacional **PostgreSQL 15+**. La arquitectura persigue tres directrices esenciales:

1. **Inversión de Control e Inyección de Dependencias Rigurosa:** Cada capacidad del dominio reside en módulos autónomos que exponen servicios inyectables exclusivamente mediante constructores tipados, eliminando acoplamientos ocultos y facilitando la cobertura de pruebas unitarias e integración.
2. **Español Absoluto en el Dominio Institucional:** Toda la taxonomía del código fuente —incluyendo clases, métodos, variables, atributos de base de datos, DTOs, decoradores personalizados y rutas REST— está redactada en idioma español técnico formal. Esta decisión garantiza una concordancia semántica perfecta entre los documentos de especificación institucional, el esquema de datos y la implementación operativa.
3. **Seguridad Defensiva y Validación Perimetral:** Ninguna petición entrante accede a la lógica de negocio sin superar una tubería de validación global basada en clases (`ValidationPipe`), complementada por autenticación mediante JSON Web Tokens (JWT) sin estado, guardias de autorización basados en roles (RBAC) y algoritmos criptográficos para salvaguardar credenciales.

---

## 2. Estructura del Código Fuente y Árbol de Directorios

La estructura de carpetas de `bumand-backend/src/` refleja la división entre componentes transversales del núcleo, abstracciones de infraestructura de datos y módulos de dominio funcional:

```
bumand-backend/src/
├── main.ts                                  # Punto de entrada de la aplicación y tubería de validación
├── app.modulo.ts                            # Módulo raíz que ensambla TypeORM y los módulos de dominio
├── app.controlador.ts                       # Controlador raíz del servicio
├── app.servicio.ts                          # Servicio básico de verificación de estado
├── app.controlador.spec.ts                  # Pruebas unitarias del controlador raíz
├── utilidades/                              # Funciones utilitarias transversales y algoritmos canónicos
│   ├── geo.utilidad.ts                      # Fórmula de Haversine para geocercas satelitales
│   └── hash.utilidad.ts                     # Encriptación unidireccional y verificación Bcrypt
├── datos/                                   # Capa de infraestructura de persistencia y semillas
│   ├── 001_esquema_completo_15_tablas.sql   # DDL canónico de PostgreSQL con 15 tablas e índices
│   ├── datos.modulo.ts                      # Módulo de TypeORM para inicialización de datos
│   └── semilla.servicio.ts                  # Seeding automático e idempotente de usuarios institucionales
└── modulos/                                 # Módulos de lógica de negocio y dominio funcional
    ├── autenticacion/                       # Emisión de tokens JWT, guardias y decoradores RBAC
    │   ├── autenticacion.modulo.ts
    │   ├── autenticacion.controlador.ts
    │   ├── autenticacion.servicio.ts
    │   ├── jwt.estrategia.ts
    │   ├── jwt.guardia.ts
    │   ├── roles.decorador.ts
    │   ├── roles.guardia.ts
    │   ├── usuario-actual.decorador.ts
    │   └── dtos/
    │       └── inicio-sesion.dto.ts
    ├── usuarios/                            # Gestión de identidades, roles institucionales y estados
    │   ├── usuarios.modulo.ts
    │   ├── usuarios.controlador.ts
    │   ├── usuarios.servicio.ts
    │   ├── entidades/
    │   │   └── usuario.entidad.ts
    │   └── dtos/
    │       └── crear-usuario.dto.ts
    ├── becarios/                            # Directorio y vinculación académica institucional
    │   ├── becarios.modulo.ts
    │   ├── becarios.controlador.ts
    │   ├── becarios.servicio.ts
    │   ├── entidades/
    │   │   └── becario.entidad.ts
    │   └── dtos/
    │       ├── crear-becario.dto.ts
    │       └── actualizar-becario.dto.ts
    ├── iglesias/                            # Catálogo de congregaciones eclesiásticas
    │   ├── iglesias.modulo.ts
    │   ├── iglesias.controlador.ts
    │   ├── iglesias.servicio.ts
    │   ├── entidades/
    │   │   └── iglesia.entidad.ts
    │   └── dtos/
    │       ├── crear-iglesia.dto.ts
    │       └── actualizar-iglesia.dto.ts
    ├── lugares-practica/                    # Sedes físicas y geocercas métricas
    │   ├── lugares-practica.modulo.ts
    │   ├── lugares-practica.controlador.ts
    │   ├── lugares-practica.servicio.ts
    │   ├── entidades/
    │   │   └── lugar-practica.entidad.ts
    │   └── dtos/
    │       ├── crear-lugar-practica.dto.ts
    │       └── actualizar-lugar-practica.dto.ts
    ├── asistencia/                          # Marcación de ingreso/salida y validación GPS
    │   ├── asistencia.modulo.ts
    │   ├── asistencia.controlador.ts
    │   ├── asistencia.servicio.ts
    │   ├── entidades/
    │   │   └── registro-asistencia.entidad.ts
    │   └── dtos/
    │       └── coordenadas.dto.ts
    ├── pasajes/                             # Cálculo del 80% en centavos y regla del día 24
    │   ├── pasajes.modulo.ts
    │   ├── pasajes.controlador.ts
    │   ├── pasajes.servicio.ts
    │   ├── pasajes.servicio.spec.ts
    │   ├── entidades/
    │   │   ├── solicitud-pasaje.entidad.ts
    │   │   └── recorrido.entidad.ts
    │   └── dtos/
    │       ├── crear-solicitud-pasaje.dto.ts
    │       └── agregar-recorrido.dto.ts
    ├── evaluaciones/                        # Matriz 360° de 5 ejes y formulario F-03 pastoral
    │   ├── evaluaciones.modulo.ts
    │   ├── evaluaciones.controlador.ts
    │   ├── evaluaciones.controlador.spec.ts
    │   ├── evaluaciones.servicio.ts
    │   ├── evaluaciones.servicio.spec.ts
    │   ├── entidades/
    │   │   ├── evaluacion.entidad.ts
    │   │   ├── evaluacion-pastor.entidad.ts
    │   │   ├── modulo-evaluacion.entidad.ts
    │   │   ├── periodo-evaluacion.entidad.ts
    │   │   └── evaluador.entidad.ts
    │   └── dtos/
    │       └── crear-evaluacion.dto.ts
    ├── practicas/                           # Aprobación de horas y firma digital del supervisor
    │   ├── practicas.modulo.ts
    │   ├── practicas.controlador.ts
    │   ├── practicas.servicio.ts
    │   ├── entidades/
    │   │   └── aprobacion-practicas.entidad.ts
    │   └── dtos/
    │       └── crear-aprobacion.dto.ts
    ├── notificaciones/                      # Alertas del sistema y trazabilidad FCM
    │   ├── notificaciones.modulo.ts
    │   ├── notificaciones.controlador.ts
    │   ├── notificaciones.servicio.ts
    │   ├── entidades/
    │   │   └── notificacion.entidad.ts
    │   └── dtos/
    │       └── crear-notificacion.dto.ts
    ├── dashboard/                           # Analítica de horas, presupuesto y puntualidad
    │   ├── dashboard.modulo.ts
    │   ├── dashboard.controlador.ts
    │   ├── dashboard.controlador.spec.ts
    │   ├── dashboard.servicio.ts
    │   └── dashboard.servicio.spec.ts
    └── pdf/                                 # Motor Headless Puppeteer para formularios oficiales
        ├── pdf.modulo.ts
        ├── pdf.controlador.ts
        ├── pdf.controlador.spec.ts
        ├── pdf.servicio.ts
        └── entidades/
            └── reporte-generado.entidad.ts
```

---

## 3. Núcleo del Servidor y Configuración de Entrada

### 3.1. Punto de Entrada (`src/main.ts`)
El arranque del servicio se rige mediante una función asíncrona de inicialización (`bootstrap`) que levanta el contenedor de inversión de control de NestJS. Incorpora de manera global la tubería de validación (`ValidationPipe`):

```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
}));
```

Esta configuración impone un estricto filtro de seguridad perimetral:
- **`whitelist: true`**: Elimina automáticamente cualquier propiedad del cuerpo JSON entrante que no esté explícitamente declarada en el Data Transfer Object (DTO) correspondiente.
- **`forbidNonWhitelisted: true`**: Arroja una excepción `BadRequestException` (HTTP 400) si el cliente envía atributos no reconocidos, neutralizando ataques de inyección de parámetros no autorizados.
- **`transform: true`**: Transforma automáticamente los tipos primitivos del cuerpo de la solicitud en las instancias de clase y tipos definidos en los DTOs.

### 3.2. Módulo Raíz (`src/app.modulo.ts`)
Constituye el agregador maestro de la infraestructura. Se conecta a la base de datos PostgreSQL mediante `TypeOrmModule.forRoot`, alimentado por las variables de entorno suministradas por `ConfigModule.forRoot({ isGlobal: true })`:
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_CONTRASENA`, `DB_DATABASE`.
- Se registran explícitamente las **15 entidades relacionales** del sistema.
- **`synchronize: false`**: La sincronización automática de esquema está expresamente desactivada en favor del control de migraciones y scripts SQL DDL formalizados, evitando alteraciones destructivas accidentales en entornos de prueba o producción.

---

## 4. Utilidades Transversales y Algoritmos Canónicos

### 4.1. Cálculo de Distancias Esféricas (`src/utilidades/geo.utilidad.ts`)
Para determinar si un estudiante becario se encuentra físicamente presente dentro de la geocerca permitida por su lugar de práctica, el sistema implementa la **Fórmula de Haversine**. Este algoritmo calcula la distancia ortodrómica entre dos pares de coordenadas geográficas en la superficie terrestre:

$$\Delta\varphi = (\text{lat}_2 - \text{lat}_1) \cdot \frac{\pi}{180}, \quad \Delta\lambda = (\text{lon}_2 - \text{lon}_1) \cdot \frac{\pi}{180}$$

$$a = \sin^2\left(\frac{\Delta\varphi}{2}\right) + \cos(\varphi_1) \cdot \cos(\varphi_2) \cdot \sin^2\left(\frac{\Delta\lambda}{2}\right)$$

$$c = 2 \cdot \arctan2\left(\sqrt{a}, \sqrt{1 - a}\right)$$

$$d = R \cdot c$$

Donde $R = 6,371,000\text{ metros}$ representa el radio esférico medio de la Tierra. La función retorna la distancia exacta en metros con precisión suficiente para validar radios urbanos de tolerancia comprendidos habitualmente entre 20 y 200 metros.

### 4.2. Seguridad Criptográfica de Credenciales (`src/utilidades/hash.utilidad.ts`)
El resguardo de las credenciales de acceso se gestiona mediante la biblioteca `bcrypt`, estableciendo una constante de 10 rondas de salting (`SALT_ROUNDS = 10`):
- **`hashearContrasena(contrasena: string): Promise<string>`**: Genera un hash unidireccional no reversible que incorpora una sal pseudoaleatoria única por cada usuario, mitigando vulnerabilidades frente a tablas arcoíris (*rainbow tables*).
- **`compararContrasena(contrasena: string, hash: string): Promise<boolean>`**: Compara en tiempo constante la clave ingresada por el usuario con el hash persistido, previniendo ataques de temporización (*timing attacks*).

---

## 5. Persistencia y Esquema Relacional de 15 Tablas

El esquema relacional de BUMAND ha sido diseñado siguiendo una rigurosa normalización en Tercera Forma Normal (3NF), asegurando la integridad referencial mediante restricciones de clave externa (`FOREIGN KEY`) con políticas explícitas de cascada (`ON DELETE CASCADE`) o nulificación (`ON DELETE SET NULL`), complementadas por índices optimizados sobre los campos más consultados.

### 5.1. Tipos Enumerados del Sistema (ENUMs)
El motor PostgreSQL maneja ocho tipos enumerados fuertemente tipados definidos en `001_esquema_completo_15_tablas.sql`:
1. `rol_usuario`: `'becario'`, `'supervisor'`, `'administrador'`.
2. `estado_usuario`: `'activo'`, `'inactivo'`.
3. `tipo_asistencia`: `'practicas'`, `'escuela_lideres'`, `'acciones_servicio'`.
4. `estado_solicitud`: `'borrador'`, `'pendiente'`, `'aprobado'`, `'rechazado'`.
5. `tramo_recorrido`: `'ida'`, `'vuelta'`.
6. `tipo_evaluador`: `'pastor'`, `'becario'`, `'supervisor'`, `'facilitador'`, `'trabajador_social'`.
7. `estado_periodo`: `'abierto'`, `'cerrado'`.
8. `estado_evaluacion`: `'pendiente'`, `'completado'`.

### 5.2. Diccionario Detallado de las 15 Tablas

#### Tabla 01: `usuarios`
Almacena las credenciales perimetrales y la identidad operativa de los actores institucionales.
- `id` (SERIAL PRIMARY KEY): Identificador unívoco.
- `nombre` (VARCHAR 150 NOT NULL): Nombre completo o denominación oficial.
- `correo` (VARCHAR 150 NOT NULL UNIQUE): Dirección de correo electrónico única.
- `contrasena_hash` (VARCHAR 255 NOT NULL): Hash Bcrypt de la clave.
- `rol` (rol_usuario NOT NULL): Rol asignado para el control de acceso RBAC.
- `estado` (estado_usuario NOT NULL DEFAULT 'activo'): Estatus de habilitación de la cuenta.
- `fcm_token` (VARCHAR 255 NULL): Token de registro para notificaciones push vía Firebase Cloud Messaging.
- `reset_codigo` (VARCHAR 10 NULL) y `reset_expira` (TIMESTAMP NULL): Token temporal para restablecimiento de contraseña.
- `created_at` (TIMESTAMP NOT NULL DEFAULT now()): Marca temporal de creación.

#### Tabla 02: `iglesias`
Catálogo de congregaciones cristianas a las que pertenecen los becarios.
- `id` (SERIAL PRIMARY KEY): Identificador de la congregación.
- `nombre` (VARCHAR 150 NOT NULL): Nombre oficial de la iglesia.
- `direccion` (VARCHAR 255 NULL): Ubicación física de la comunidad de fe.

#### Tabla 03: `lugares_practica`
Sedes físicas de Diaconía FRIF-IFD habilitadas para prácticas institucionales.
- `id` (SERIAL PRIMARY KEY): Identificador de la sede.
- `nombre` (VARCHAR 150 NOT NULL): Nombre de la sucursal o unidad operativa.
- `direccion` (VARCHAR 255 NULL): Dirección postal.
- `latitud` (DECIMAL 9,6 NOT NULL): Latitud geográfica del centroide de la sede.
- `longitud` (DECIMAL 9,6 NOT NULL): Longitud geográfica del centroide de la sede.
- `radio_tolerancia_m` (INTEGER NOT NULL): Radio de tolerancia en metros para la geocerca.

#### Tabla 04: `becarios`
Ficha académica y perfil de vinculación institucional del estudiante universitario.
- `id` (SERIAL PRIMARY KEY): Identificador del becario.
- `usuario_id` (INTEGER NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE): Vínculo 1:1 con su usuario del sistema.
- `ci` (VARCHAR 20 UNIQUE NULL): Cédula de identidad.
- `carrera` (VARCHAR 100 NOT NULL): Carrera de formación profesional.
- `universidad` (VARCHAR 150 NOT NULL): Casa superior de estudios.
- `institucion` (VARCHAR 150 NULL): Entidad patrocinadora ('Diaconía FRIF-IFD').
- `iglesia_id` (INTEGER REFERENCES iglesias(id) ON DELETE SET NULL): Congregación eclesiástica asignada.
- `lugar_practica_id` (INTEGER REFERENCES lugares_practica(id) ON DELETE SET NULL): Sede de práctica preprofesional.
- `fecha_ingreso` (DATE NOT NULL): Fecha formal de incorporación al programa.
- `supervisor_id` (INTEGER REFERENCES usuarios(id) ON DELETE SET NULL): Supervisor asignado.
- `unidad` (VARCHAR 100 NULL): Unidad operativa interna de desempeño (ej. 'Seguridad Física', 'Consultorio Médico', 'Productos y Canales').

#### Tabla 05: `registros_asistencia`
Control horario y geoposicional de jornadas cumplidas.
- `id` (SERIAL PRIMARY KEY): Identificador del registro.
- `becario_id` (INTEGER NOT NULL REFERENCES becarios(id) ON DELETE CASCADE): Estudiante que registra la jornada.
- `tipo` (tipo_asistencia NOT NULL): Categoría de jornada cumplida.
- `fecha` (DATE NOT NULL): Día calendario del evento.
- `hora_ingreso` (TIME NULL) y `hora_salida` (TIME NULL): Horas marcadas en formato HH:MM:SS.
- `lat_ingreso`, `lng_ingreso`, `lat_salida`, `lng_salida` (DECIMAL 9,6 NULL): Coordenadas GPS del dispositivo.
- `horas_trabajadas` (DECIMAL 5,2 NULL): Horas netas cronometradas entre ingreso y salida.
- `dentro_de_radio` (BOOLEAN NOT NULL DEFAULT false): Indica si el ingreso se produjo dentro de la geocerca asignada.
- `dentro_de_horario` (BOOLEAN NULL): Cumplimiento de la franja horaria establecida.
- `created_at` (TIMESTAMP NOT NULL DEFAULT now()): Marca temporal.
- *Índice:* `idx_registros_asistencia_becario_fecha` sobre `(becario_id, fecha)`.

#### Tabla 06: `solicitudes_pasajes`
Cabecera de liquidación periódica de viáticos y transporte.
- `id` (SERIAL PRIMARY KEY): Identificador de la solicitud.
- `becario_id` (INTEGER NOT NULL REFERENCES becarios(id) ON DELETE CASCADE): Becario solicitante.
- `periodo` (VARCHAR 20 NOT NULL): Periodo mensual declarado (ej. 'Octubre 2026').
- `monto_total` (DECIMAL 8,2 NOT NULL DEFAULT 0.00): Importe total de recorridos acumulados.
- `monto_devolucion` (DECIMAL 8,2 NOT NULL DEFAULT 0.00): Importe a devolver calculado estrictamente al 80%.
- `estado` (estado_solicitud NOT NULL DEFAULT 'borrador'): Estado del flujo administrativo.
- `observaciones` (TEXT NULL): Justificación obligatoria en caso de rechazo u observaciones.
- `supervisor_id` (INTEGER REFERENCES usuarios(id) ON DELETE SET NULL): Supervisor que emitió la resolución.
- `datos_becario` (JSONB NULL): Copia inmutable de los datos institucionales del becario al momento del envío.
- `fecha_envio` (TIMESTAMP NULL) y `fecha_resolucion` (TIMESTAMP NULL): Hitos temporales del flujo.
- `created_at` (TIMESTAMP NOT NULL DEFAULT now()): Creación del borrador.
- *Índice:* `idx_solicitudes_pasajes_becario_periodo` sobre `(becario_id, periodo)`.

#### Tabla 07: `recorridos`
Desglose atómico de los trayectos individuales de transporte.
- `id` (SERIAL PRIMARY KEY): Identificador del recorrido.
- `solicitud_id` (INTEGER NOT NULL REFERENCES solicitudes_pasajes(id) ON DELETE CASCADE): Vínculo 1:N con la solicitud.
- `fecha` (DATE NOT NULL): Fecha en que se realizó el traslado.
- `tramo` (tramo_recorrido NOT NULL): Dirección del movimiento (`ida` o `vuelta`).
- `origen` (VARCHAR 150 NOT NULL) y `destino` (VARCHAR 150 NOT NULL): Puntos geográficos declarados.
- `tarifa` (DECIMAL 6,2 NOT NULL): Costo unitario del pasaje en bolivianos.
- `lat_origen`, `lng_origen`, `lat_destino`, `lng_destino` (DECIMAL 9,6 NULL): Coordenadas GPS opcionales.
- `apoyo_realizado` (VARCHAR 255 NULL): Motivo o tarea de apoyo justificada.
- `created_at` (TIMESTAMP NOT NULL DEFAULT now()).
- *Índice:* `idx_recorridos_solicitud_id` sobre `(solicitud_id)`.

#### Tabla 08: `modulos_evaluacion`
Catálogo estructurado de las dimensiones formativas del Programa BUMAND.
- `id` (SERIAL PRIMARY KEY): Identificador canónico (1 al 5).
- `nombre` (VARCHAR 100 NOT NULL): Denominación del módulo.
- `descripcion` (TEXT NULL): Propósito y alcance del eje formativo.
- `orden` (INTEGER NOT NULL): Secuencia de presentación en interfaz.

#### Tabla 09: `periodos_evaluacion`
Ciclos semestrales de evaluación del desempeño formativo.
- `id` (SERIAL PRIMARY KEY): Identificador del periodo.
- `nombre` (VARCHAR 50 NOT NULL): Denominación del ciclo (ej. 'Semestre II - 2026').
- `fecha_inicio` (DATE NOT NULL) y `fecha_fin` (DATE NOT NULL): Ventana de vigencia.
- `estado` (estado_periodo NOT NULL DEFAULT 'abierto'): Control de admisión de calificaciones.

#### Tabla 10: `evaluadores`
Actores calificados que intervienen en la evaluación multi-fuente.
- `id` (SERIAL PRIMARY KEY): Identificador del evaluador.
- `nombre` (VARCHAR 150 NOT NULL): Nombre completo del evaluador.
- `tipo` (tipo_evaluador NOT NULL): Rol evaluativo (`pastor`, `becario`, `supervisor`, `facilitador`, `trabajador_social`).
- `correo` (VARCHAR 150 NULL) y `telefono` (VARCHAR 30 NULL): Canales de contacto.

#### Tabla 11: `evaluaciones`
Registro de calificación por módulo, periodo y evaluador.
- `id` (SERIAL PRIMARY KEY): Identificador de la evaluación.
- `becario_id` (INTEGER NOT NULL REFERENCES becarios(id) ON DELETE CASCADE).
- `periodo_id` (INTEGER NOT NULL REFERENCES periodos_evaluacion(id) ON DELETE RESTRICT).
- `modulo_id` (INTEGER NOT NULL REFERENCES modulos_evaluacion(id) ON DELETE RESTRICT).
- `evaluador_id` (INTEGER NOT NULL REFERENCES evaluadores(id) ON DELETE RESTRICT).
- `puntaje` (DECIMAL 5,2 NULL CHECK (puntaje >= 0 AND puntaje <= 100)): Nota asignada sobre 100.
- `estado` (estado_evaluacion NOT NULL DEFAULT 'pendiente').
- `observaciones` (TEXT NULL): Comentarios cualitativos.
- `archivo_pdf` (VARCHAR 255 NULL): Ruta al reporte certificado emitido.
- `fecha_evaluacion` (DATE NULL): Fecha en que se consolidó la nota.
- `created_at` (TIMESTAMP NOT NULL DEFAULT now()).
- *Restricción de Unicidad:* `uq_evaluacion_becario_periodo_modulo` sobre `(becario_id, periodo_id, modulo_id)` para asegurar que cada módulo sea calificado una única vez por periodo.
- *Índice:* `idx_evaluaciones_becario_periodo` sobre `(becario_id, periodo_id)`.

#### Tabla 12: `evaluaciones_pastor`
Extensión especializada 1:1 de `evaluaciones` correspondiente al Formulario F-03 eclesiástico.
- `id` (SERIAL PRIMARY KEY): Identificador del registro.
- `evaluacion_id` (INTEGER NOT NULL UNIQUE REFERENCES evaluaciones(id) ON DELETE CASCADE): Vinculación 1:1 estricta con la tabla base.
- `pastor_nombre` (VARCHAR 150 NOT NULL): Nombre del pastor principal o ministro oficiante.
- `pastor_correo` (VARCHAR 150 NULL) y `pastor_celular` (VARCHAR 30 NULL): Datos de contacto pastoral.
- `iglesia_nombre` (VARCHAR 150 NOT NULL) y `iglesia_direccion` (VARCHAR 255 NULL): Datos de la congregación.
- `campos_formulario` (JSONB NULL): Estructura flexible de respuestas al cuestionario oficial F-03 (testimonio, liderazgo, vocación, compromiso).
- `fecha` (DATE NOT NULL DEFAULT CURRENT_DATE): Fecha de emisión.

#### Tabla 13: `aprobaciones_practicas`
Certificación jurídica y funcional de cumplimiento de horas de práctica.
- `id` (SERIAL PRIMARY KEY): Identificador de la certificación.
- `becario_id` (INTEGER NOT NULL REFERENCES becarios(id) ON DELETE CASCADE).
- `supervisor_id` (INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT).
- `periodo` (VARCHAR 20 NOT NULL): Periodo académico certificado.
- `horas_aprobadas` (DECIMAL 6,2 NOT NULL): Volumen de horas convalidadas.
- `firma_digital` (TEXT NOT NULL): Representación en Base64 o firma digitalizada manuscrita del supervisor.
- `observaciones` (TEXT NULL): Notas de desempeño.
- `created_at` (TIMESTAMP NOT NULL DEFAULT now()).
- *Índice:* `idx_aprobaciones_practicas_becario_periodo` sobre `(becario_id, periodo)`.

#### Tabla 14: `notificaciones`
Bandeja de mensajes internos y alertas de eventos del sistema.
- `id` (SERIAL PRIMARY KEY): Identificador de la notificación.
- `usuario_id` (INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE): Destinatario del mensaje.
- `tipo` (VARCHAR 50 NOT NULL): Categoría del aviso ('pasajes', 'asistencia', 'evaluaciones', 'sistema').
- `mensaje` (TEXT NOT NULL): Contenido textual del comunicado.
- `leido` (BOOLEAN NOT NULL DEFAULT false): Estado de lectura.
- `fecha_envio` (TIMESTAMP NOT NULL DEFAULT now()).
- *Índice:* `idx_notificaciones_usuario_leido` sobre `(usuario_id, leido)`.

#### Tabla 15: `reportes_generados`
Repositorio histórico de documentos oficiales exportados a PDF.
- `id` (SERIAL PRIMARY KEY): Identificador del documento.
- `becario_id` (INTEGER NOT NULL REFERENCES becarios(id) ON DELETE CASCADE): Estudiante concernido.
- `periodo` (VARCHAR 20 NOT NULL): Periodo al que atañe el reporte.
- `url_pdf` (VARCHAR 255 NOT NULL): Ubicación o nombre de almacenamiento del archivo generado.
- `fecha_generacion` (TIMESTAMP NOT NULL DEFAULT now()).
- *Índice:* `idx_reportes_generados_becario_periodo` sobre `(becario_id, periodo)`.

### 5.3. Servicio de Semilla Institucional (`src/datos/semilla.servicio.ts`)
Para garantizar la operatividad inmediata sin requerir inserciones manuales propensas a errores, el servicio `SemillaServicio` se ejecuta automáticamente al iniciar la aplicación (`OnModuleInit`). Realiza una comprobación idempotente de los siguientes datos canónicos:

1. **Administrador General:** Valida la existencia del usuario administrador institucional (`admin@wscrt.com` o el configurado en `.env`), creando la cuenta con contraseña hasheada y rol `Rol.ADMINISTRADOR` si no existiese.
2. **Sede Central Diaconía IFD El Alto:** Crea la sede física principal en `Av. Juan Pablo II esq. Calle Sbtte. Jorge Eulert 125, El Alto`, con coordenadas geográficas exactas (`latitud: -16.505000, longitud: -68.163000`) y radio de tolerancia de 50 metros.
3. **Becarios Institucionales de Referencia:** Da de alta tres becarios oficiales vinculados a sus unidades operativas de Diaconía:
   - *Nilda Amalia Churata Paye* (CI 10028341, Educación Parvularia, UMSA) asignada a la unidad de **Seguridad Física**.
   - *Edgar Elías Alarcón Huanca* (CI 9160054, Medicina, UMSA) asignado a la unidad de **Consultorio Médico**.
   - *Adai Belén Huayta Cardozo* (CI 13696496, Estadística, UMSA) asignada a la unidad de **Productos y Canales**.
4. **Catálogo de 5 Módulos de Evaluación:** Garantiza la presencia de los 5 ejes formativos del Programa BUMAND.
5. **Periodos Semestrales 2026:** Registra el *Semestre I - 2026* (estado cerrado) y el *Semestre II - 2026* (estado abierto).

---

## 6. Módulos de Dominio y Lógica de Negocio

### 6.1. Módulo de Autenticación (`src/modulos/autenticacion/`)
Implementa el flujo de autenticación perimetral mediante credenciales y emisión de tokens JWT:
- **`InicioSesionDto`**: Valida que el `correo` tenga formato de dirección electrónica válida y que la `contrasena` no esté vacía.
- **`AutenticacionServicio.iniciarSesion`**: Localiza al usuario por su correo, verifica su clave mediante `compararContrasena` y genera un token JWT firmado cuyo payload contiene `sub: usuario.id`, `correo: usuario.correo` y `rol: usuario.rol`.
- **`JwtEstrategia` y `JwtGuardia`**: Intercepta cabeceras `Authorization: Bearer <token>`, decodifica el token y recupera la entidad completa del usuario, mapeándola contextualmente a `req.usuario`.
- **`RolesGuardia` y Decorador `@Roles(...)`**: Permite restringir el acceso a endpoints evaluando si el rol del usuario autenticado coincide con los roles requeridos para la acción.
- **Decorador `@UsuarioActual()`**: Extrae la entidad `Usuario` inyectada en la petición HTTP para consumo inmediato en los métodos de los controladores.

### 6.2. Módulo de Usuarios (`src/modulos/usuarios/`)
Gestiona el ciclo de vida de los operadores del sistema:
- **`UsuariosControlador`**: Protegido integralmente por `JwtGuardia` y `RolesGuardia`. Ofrece rutas para creación (`POST /usuarios`), listado filtrado por rol (`GET /usuarios?rol=supervisor`) y actualización de estado (`PUT /usuarios/:id/estado`).
- **Reglas de Negocio en `UsuariosServicio`**:
  - Impide explícitamente la creación de cuentas con rol `becario` desde este módulo, exigiendo que se utilice el módulo especializado de becarios para mantener la integridad relacional.
  - Prohíbe que un usuario desactive su propia cuenta administrativa (`id === usuarioAutenticado.id && estado === EstadoUsuario.INACTIVO`).

### 6.3. Módulo de Becarios (`src/modulos/becarios/`)
Constituye el núcleo de administración de los estudiantes universitarios vinculados al programa:
- **`CrearBecarioDto` y `ActualizarBecarioDto`**: Gestionan atributos personales, académicos y de vinculación (carrera, universidad, unidad, iglesia asignada, sede de práctica y supervisor a cargo).
- **Transaccionalidad en la Creación (`BecariosServicio.crear`)**: Crea en primer término la cuenta en la tabla `usuarios` (rol `becario`, estado `activo`) con contraseña encriptada, y crea inmediatamente después el registro hijo en `becarios` enlazado mediante `usuario_id`.
- **Validación de Supervisor**: Comprueba que el `supervisor_id` provisto pertenezca a un usuario registrado, activo y con rol `supervisor` o `administrador`.
- **Segmentación de Acceso por Rol**: Si quien consulta el listado de becarios es un supervisor, el servicio filtra automáticamente la consulta para retornar exclusivamente a los estudiantes que tiene a su cargo.
- **Ruta de Perfil Propio (`GET /becarios/me` y `PUT /becarios/me`)**: Permite que el estudiante autenticado consulte y mantenga actualizada su casa de estudios sin requerir permisos administrativos.
- **Eliminación Lógica**: El método `eliminar` desactiva la cuenta del usuario (`estado = EstadoUsuario.INACTIVO`), conservando intacto su historial de asistencias y evaluaciones para efectos de auditoría.

### 6.4. Módulos de Iglesias y Lugares de Práctica (`src/modulos/iglesias/` y `src/modulos/lugares-practica/`)
- **Iglesias**: CRUD completo (`/iglesias`) administrado por usuarios con rol de administrador, accesible para consulta por supervisores. Permite organizar la asignación comunitaria del becario.
- **Lugares de Práctica**: CRUD completo (`/lugares-practica`) para configurar las sedes institucionales de Diaconía. Cada registro define las coordenadas decimales (`latitud`, `longitud`) y el `radio_tolerancia_m`, sirviendo como referencia física inmutable para el control de asistencia.

### 6.5. Módulo de Asistencia y Control Satelital (`src/modulos/asistencia/`)
Permite registrar la presencia física del estudiante mediante geolocalización satelital en tiempo real:
- **`CoordenadasDto`**: Recibe `latitud`, `longitud`, `tipo` de jornada, `precision` del GPS reportada por el dispositivo móvil y la bandera `simulada` (*mock location*).
- **Lógica de Registro de Ingreso (`AsistenciaServicio.registrarIngreso`)**:
  1. Verifica que el estudiante tenga una sede asignada en su ficha de becario.
  2. Valida que no exista un ingreso previo abierto (con `hora_salida` nula) en el mismo día y para el mismo tipo de jornada.
  3. Calcula la distancia ortodrómica en metros entre las coordenadas enviadas y el centroide de la sede asignada usando `calcularDistanciaMetros`.
  4. Incorpora un margen dinámico de error GPS acotado: `margen = Math.min(Math.max(dto.precision || 0, 0), MARGEN_GPS_MAXIMO_M)`, donde `MARGEN_GPS_MAXIMO_M = 10` metros.
  5. Determina la validez de ubicación: `dentro_de_radio = dto.simulada !== true && distancia_m <= becario.lugar_practica.radio_tolerancia_m + margen`. Si el dispositivo utiliza ubicación simulada, la marcación se registra pero con `dentro_de_radio = false`.
  6. Guarda la hora de ingreso en formato `HH:MM:SS`.
- **Lógica de Registro de Salida (`AsistenciaServicio.registrarSalida`)**:
  1. Localiza el registro de ingreso abierto del día.
  2. Almacena la hora y coordenadas de salida.
  3. Computa el intervalo cronológico exacto en horas decimales con redondeo a dos decimales:
     $$\text{horas\_trabajadas} = (h_s + m_s/60) - (h_i + m_i/60)$$

### 6.6. Módulo de Pasajes y Viáticos (`src/modulos/pasajes/`)
Automatiza la rendición y reintegro del 80% de los pasajes de transporte urbano consumidos en actividades diaconales.

#### A. Aritmética de Centavos Enteros para el Reembolso del 80%
El cálculo monetario en aplicaciones financieras no debe realizarse con tipos de coma flotante estándar debido a las imprecisiones de redondeo binario inherentes a la norma IEEE 754. Para asegurar exactitud contable estricta, `PasajesServicio` opera sobre números enteros que representan centavos de boliviano:

$$\text{tarifa\_centavos} = \text{round}(\text{tarifa} \times 100)$$

$$\text{total\_centavos} = \sum_{i=1}^{n} \text{tarifa\_centavos}_i$$

$$\text{devolucion\_centavos} = \text{round}\left(\frac{\text{total\_centavos} \times 80}{100}\right)$$

Posteriormente, las cantidades se transforman a formato decimal monetario dividiendo entre 100 (`monto_total = total_centavos / 100`, `monto_devolucion = devolucion_centavos / 100`). De esta forma se eliminan diferencias de centavos entre las planillas de los becarios y los balances contables de la institución.

#### B. Regla Institucional del Día 24
Para evitar rendiciones parciales o desordenadas a lo largo del mes, la normativa institucional de Diaconía BUMAND dictamina que la solicitud mensual de pasajes debe consolidarse y remitirse formalmente únicamente a partir del **día 24 de cada mes**. El método `enviarSolicitud` evalúa esta restricción de negocio:
- Comprueba que la solicitud se encuentre en estado `borrador`.
- Verifica que cuente con al menos un recorrido registrado en la tabla `recorridos`.
- Inspecciona el día calendario de la fecha de referencia:
  ```typescript
  const dia_del_mes = fecha_referencia.getDate();
  if (dia_del_mes < 24) {
    throw new BadRequestException(
      `Regla institucional BUMAND: El envío formal de la solicitud de pasajes solo está permitido a partir del día 24 de cada mes. Día actual: ${dia_del_mes}.`
    );
  }
  ```
- Al cumplirse la regla, la solicitud transita al estado `pendiente`, registrando la `fecha_envio`.

#### C. Aprobación y Rechazo con Observación Obligatoria
- **Aprobación (`aprobarSolicitud`)**: Cambia el estado a `aprobado`, registrando al supervisor resolutor y la `fecha_resolucion`.
- **Rechazo Observado (`rechazarSolicitud`)**: Si el supervisor detecta irregularidades, la API exige imperativamente un texto de retroalimentación (`observaciones`). No se admite el rechazo sin justificación escrita, garantizando el derecho del estudiante a conocer la razón y subsanar su declaración.

### 6.7. Módulo de Evaluaciones 360° y Formulario F-03 (`src/modulos/evaluaciones/`)
Digitaliza la matriz multi-fuente de evaluación formativa de BUMAND, combinando valoraciones cuantitativas y cualitativas de cinco actores distintos.

#### A. Matriz Ponderada Canónica (5 Dimensiones)
Cada semestre académico, el desempeño del becario se califica a través de cinco ejes con pesos porcentuales predefinidos:

| Módulo | Dimensión Formativa | Actor Evaluador | Peso Porcentual |
| :---: | :--- | :--- | :---: |
| 1 | **Liderazgo en la Iglesia (Formulario F-03)** | Pastor de la Congregación | 25% |
| 2 | **Autoevaluación Académica** | Estudiante Becario | 20% |
| 3 | **Evaluación del Mentor / Prácticas** | Supervisor Diaconía | 25% |
| 4 | **Evaluación Escuela de Líderes** | Facilitador Pastoral | 15% |
| 5 | **Evaluación Socioeconómica** | Trabajador Social | 15% |
| **Total** | **Evaluación Integral 360°** | **Multi-Actor Institucional** | **100%** |

#### B. Algoritmo de Calificación Total y Escala Vigesimal
El método `calcularCalificacionTotal` recopila los puntajes de los cinco módulos y calcula:
1. **Calificación sobre 100 Puntos ($C_{100}$):**
   $$C_{100} = \sum_{i=1}^{5} \frac{P_i \times \text{peso}_i}{100}$$
2. **Calificación sobre Escala Vigesimal ($C_{20}$):**
   $$C_{20} = \frac{C_{100} \times 20}{100}$$
3. **Clasificación Cualitativa del Rendimiento:**
   - **Sobresaliente:** $C_{100} \ge 90$
   - **Muy Bueno:** $80 \le C_{100} < 90$
   - **Bueno:** $70 \le C_{100} < 80$
   - **En Observación:** $60 \le C_{100} < 70$
   - **Insuficiente:** $C_{100} < 60$

El resultado reporta además cuántos de los 5 módulos han sido completados (`modulos_evaluados`) y si la evaluación del semestre se encuentra concluida en su totalidad (`es_completa`).

#### C. Extensión Eclesiástica F-03 (`evaluaciones_pastor`)
Para el Módulo 1 (Liderazgo en la Iglesia), se persiste una entidad vinculada 1:1 (`EvaluacionPastor`) que resguarda el nombre del pastor oficiante, datos de contacto de la iglesia y el payload estructurado `campos_formulario` tipo `JSONB`. Esto permite recoger los criterios cualitativos institucionales de testimonio de vida, responsabilidad pastoral y servicio diaconal sin alterar el esquema tabular fijo.

### 6.8. Módulo de Prácticas Preprofesionales (`src/modulos/practicas/`)
Formaliza la acreditación académica requerida por las universidades de procedencia de los becarios:
- Registra el total de horas convalidadas en el periodo (`horas_aprobadas`).
- Almacena la rúbrica manuscrita digitalizada del supervisor (`firma_digital`), capturada en el frontend sobre un lienzo HTML5 Canvas en formato Base64.
- Genera el comprobante de convalidación para su inclusión en los expedientes de graduación de los estudiantes.

### 6.9. Módulo de Notificaciones (`src/modulos/notificaciones/`)
Provee la infraestructura de mensajería interna del ecosistema:
- Permite la creación de alertas asociadas a eventos clave (registro de salida pendiente, resolución de solicitudes de pasajes, apertura de periodos de evaluación).
- Soporta la lectura interactiva (`marcarLeida`) y conteo en tiempo real de notificaciones pendientes (`contarNoLeidas`).
- Se encuentra alineado con la infraestructura Firebase Cloud Messaging mediante la sincronización del token `fcm_token` de la entidad `Usuario`.

### 6.10. Módulo de Dashboard Analítico (`src/modulos/dashboard/`)
Consolida métricas e inteligencia operativa en tiempo real para la toma de decisiones por parte de la directiva institucional:
1. **Métricas Globales:** Cantidad de becarios activos, horas acumuladas en el programa, promedio de horas por estudiante y conteo de tareas pendientes (evaluaciones y pasajes en revisión).
2. **Consolidado Presupuestario del 80%:** Desglose del presupuesto de viáticos con total declarado, total liquidado al 80%, comparación frente al límite mensual institucional (Bs 10,000 por defecto) y cálculo del porcentaje ejecutado.
3. **Tendencia Mensual de Horas:** Serie temporal de 12 meses que grafica el volumen de horas aportadas por los becarios a lo largo del año.
4. **Ranking de Puntualidad y Cumplimiento Geográfico:** Algoritmo que clasifica a los estudiantes evaluando la relación entre asistencias a tiempo y dentro de geocerca respecto al total de jornadas marcadas, reconociendo el compromiso institucional.

### 6.11. Módulo de Generación de Reportes PDF (`src/modulos/pdf/`)
Emite documentos oficiales certificados con formato idéntico a las planillas impresas históricas de Diaconía FRIF-IFD:
- **`PdfServicio`**: Emplea una instancia de Puppeteer en modo *headless* para renderizar plantillas HTML/CSS en documentos PDF con estándar vectorial A4 y renderizado de fondos institucionales (`printBackground: true`).
- **`PdfControlador.generarReporteEvaluacion`**: Construye el informe de evaluación 360° o Formulario F-03 pastoral, integrando el membrete institucional, los tokens cromáticos de Diaconía (#063A6B, #17B4C4), la tabla estructurada de calificaciones, las observaciones del evaluador y el recuadro formal de firma digital de conformidad.

---

## 7. Matriz de Endpoints de la API REST

A continuación se resume la totalidad de las rutas de red expuestas por el servidor NestJS:

| Módulo | Método | Ruta de Red | Rol Mínimo Requerido | Propósito Funcional |
| :--- | :---: | :--- | :---: | :--- |
| **Autenticación** | `POST` | `/autenticacion/inicio-sesion` | Público | Validación de credenciales y emisión de token JWT |
| **Usuarios** | `POST` | `/usuarios` | Administrador | Alta de cuentas para supervisores y administradores |
| | `GET` | `/usuarios` | Supervisor | Listado del personal y filtrado por rol |
| | `PUT` | `/usuarios/:id/estado` | Administrador | Habilitación o suspensión de cuentas de usuario |
| **Becarios** | `POST` | `/becarios` | Administrador | Alta integral de becario con usuario relacional |
| | `GET` | `/becarios` | Supervisor | Directorio general o becarios asignados al supervisor |
| | `GET` | `/becarios/me` | Becario | Ficha del perfil del estudiante autenticado |
| | `PUT` | `/becarios/me` | Becario | Actualización de casa de estudios del propio becario |
| | `GET` | `/becarios/:id` | Supervisor | Detalle completo de un becario |
| | `PUT` | `/becarios/:id` | Administrador | Modificación de carrera, sede, iglesia o supervisor |
| | `DELETE` | `/becarios/:id` | Administrador | Desactivación lógica de la cuenta del becario |
| **Iglesias** | `POST` | `/iglesias` | Administrador | Registro de nueva congregación eclesiástica |
| | `GET` | `/iglesias` | Supervisor | Catálogo de iglesias registradas |
| | `GET` | `/iglesias/:id` | Supervisor | Consulta de iglesia por identificador |
| | `PUT` | `/iglesias/:id` | Administrador | Actualización de datos de la congregación |
| | `DELETE` | `/iglesias/:id` | Administrador | Eliminación de congregación del catálogo |
| **Lugares Práctica** | `POST` | `/lugares-practica` | Administrador | Alta de sede física y delimitación de geocerca |
| | `GET` | `/lugares-practica` | Supervisor | Listado de sedes con latitud, longitud y radio |
| | `GET` | `/lugares-practica/:id` | Supervisor | Consulta de sede por identificador |
| | `PUT` | `/lugares-practica/:id` | Administrador | Ajuste métrico del radio y centroide de geocerca |
| | `DELETE` | `/lugares-practica/:id` | Administrador | Retiro de sede de prácticas |
| **Asistencia** | `POST` | `/asistencia/ingreso` | Becario | Marcación de ingreso con validación Haversine |
| | `POST` | `/asistencia/salida` | Becario | Marcación de salida y cronometraje de horas |
| | `GET` | `/asistencia` | Supervisor | Consulta histórica de registros de asistencia |
| **Pasajes** | `POST` | `/pasajes` | Becario | Apertura de borrador mensual de liquidación |
| | `POST` | `/pasajes/recorridos` | Becario | Registro de tramo de ida/vuelta y recálculo del 80% |
| | `GET` | `/pasajes` | Supervisor | Bandeja de solicitudes de viáticos |
| | `GET` | `/pasajes/:id` | Becario | Detalle de solicitud y lista de recorridos |
| | `GET` | `/pasajes/becario/:becario_id` | Becario | Historial de solicitudes del estudiante |
| | `POST/PATCH` | `/pasajes/:id/enviar` | Becario | Envío formal sujeto a la regla del día 24 |
| | `PATCH` | `/pasajes/:id/aprobar` | Supervisor | Aprobación de la liquidación de viáticos |
| | `PATCH` | `/pasajes/:id/rechazar` | Supervisor | Rechazo obligatorio con observaciones fundamentadas |
| **Evaluaciones** | `POST` | `/evaluaciones` | Becario | Registro de evaluación por módulo y actor |
| | `GET` | `/evaluaciones` | Supervisor | Listado histórico de evaluaciones |
| | `GET` | `/evaluaciones/becario/:becario_id` | Becario | Evaluaciones del estudiante en el periodo |
| | `GET` | `/evaluaciones/becario/:b_id/periodo/:p_id/calificacion-total` | Becario | Cálculo ponderado 360°, nota vigesimal y estatus |
| | `GET` | `/evaluaciones/:id` | Becario | Detalle de evaluación y respuestas F-03 |
| | `PATCH` | `/evaluaciones/:id/estado` | Supervisor | Cambio de estado (pendiente a completado) |
| | `GET` | `/evaluaciones/catalogos/modulos` | Becario | Catálogo de los 5 módulos canónicos de evaluación |
| | `GET` | `/evaluaciones/catalogos/periodos` | Becario | Catálogo de periodos semestrales |
| | `GET` | `/evaluaciones/catalogos/evaluadores` | Supervisor | Listado de actores evaluadores habilitados |
| **Prácticas** | `POST` | `/practicas` | Supervisor | Convalidación de horas y registro de firma digital |
| | `GET` | `/practicas` | Supervisor | Listado general de horas certificadas |
| | `GET` | `/practicas/becario/:becario_id` | Becario | Certificaciones del estudiante |
| | `GET` | `/practicas/:id` | Supervisor | Certificado individual de prácticas |
| **Notificaciones** | `POST` | `/notificaciones` | Administrador | Envío de alerta interna o institucional |
| | `GET` | `/notificaciones/usuario/:usuario_id` | Becario | Bandeja de notificaciones del usuario |
| | `PATCH` | `/notificaciones/:id/leida` | Becario | Marcado de notificación como leída |
| | `GET` | `/notificaciones/usuario/:usuario_id/no-leidas` | Becario | Conteo de mensajes pendientes de lectura |
| **Dashboard** | `GET` | `/dashboard/estadisticas` | Supervisor | Consolidado analítico de horas, presupuesto y ranking |
| **PDF** | `GET` | `/pdf/evaluacion/:id` | Becario | Descarga del informe oficial de evaluación / F-03 en PDF |

---

## 8. Verificación de Compilación y Aseguramiento de Calidad

El backend de BUMAND cuenta con un flujo integral de pruebas automatizadas y compilación estructurada:
- **Compilación Oficial:** `npm run compilar` ejecuta el empaquetado optimizado mediante Webpack 5 y Nest CLI, garantizando la resolución limpia de todas las dependencias y la verificación estricta de tipos de TypeScript sin emitir advertencias.
- **Suite de Pruebas Unitarias:** `npm test` corre el motor Jest sobre 7 suites de pruebas (`dashboard.servicio.spec.ts`, `evaluaciones.controlador.spec.ts`, `pasajes.servicio.spec.ts`, `evaluaciones.servicio.spec.ts`, `pdf.controlador.spec.ts`, `dashboard.controlador.spec.ts`, `app.controlador.spec.ts`), con 16 pruebas aprobadas al 100%. Las pruebas validan de forma explícita el cálculo en centavos enteros del 80%, la regla restrictiva del día 24, la ponderación del sistema 360° y la generación de reportes.
- **Mantenimiento y Formato:** Se dispone de los scripts estandarizados `npm run formatear` (Prettier), `npm run revisar` (ESLint) y modos de ejecución `npm run iniciar:desarrollo` y `npm run iniciar:produccion`.

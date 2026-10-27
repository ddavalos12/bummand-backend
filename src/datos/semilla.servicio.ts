import { Injectable, OnModuleInit, Logger, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Usuario, Rol, EstadoUsuario } from '../modulos/usuarios/entidades/usuario.entidad';
import { Becario } from '../modulos/becarios/entidades/becario.entidad';
import { LugarPractica } from '../modulos/lugares-practica/entidades/lugar-practica.entidad';
import { Iglesia } from '../modulos/iglesias/entidades/iglesia.entidad';
import { ModuloEvaluacion } from '../modulos/evaluaciones/entidades/modulo-evaluacion.entidad';
import { PeriodoEvaluacion, EstadoPeriodo } from '../modulos/evaluaciones/entidades/periodo-evaluacion.entidad';
import { Evaluador, TipoEvaluador } from '../modulos/evaluaciones/entidades/evaluador.entidad';
import { TarifaTransporte } from '../modulos/pasajes/entidades/tarifa-transporte.entidad';
import { ParadaTransporte, PARADAS_OFICIALES_DEFECTO } from '../modulos/pasajes/entidades/parada-transporte.entidad';
import { Evento, TipoEvento, EstadoEvento } from '../modulos/eventos/entidades/evento.entidad';
import { HorarioApoyo } from '../modulos/becarios/entidades/horario-apoyo.entidad';
import { AsignacionPractica } from '../modulos/becarios/entidades/asignacion-practica.entidad';
import { PreguntaBienestar } from '../modulos/evaluaciones/entidades/pregunta-bienestar.entidad';
import { Cuestionario } from '../modulos/evaluaciones/entidades/cuestionario.entidad';
import { PreguntaCuestionario } from '../modulos/evaluaciones/entidades/pregunta-cuestionario.entidad';
import { PREGUNTAS_BIENESTAR_DEFECTO } from '../modulos/evaluaciones/constantes/preguntas-bienestar.constantes';
import { hashearContrasena } from '../utilidades/hash.utilidad';
import {
  ADMINISTRADORES_SEMILLA,
  SUPERVISORES_SEMILLA,
  BECARIOS_SEMILLA,
  IGLESIAS_SEMILLA,
} from './semilla-datos.constantes';

@Injectable()
export class SemillaServicio implements OnModuleInit {
  private readonly logger = new Logger(SemillaServicio.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Usuario)
    private readonly usuario_repo: Repository<Usuario>,
    @InjectRepository(Becario)
    private readonly becario_repo: Repository<Becario>,
    @InjectRepository(LugarPractica)
    private readonly lugar_repo: Repository<LugarPractica>,
    @InjectRepository(Iglesia)
    private readonly iglesia_repo: Repository<Iglesia>,
    @InjectRepository(ModuloEvaluacion)
    private readonly modulo_repo: Repository<ModuloEvaluacion>,
    @InjectRepository(PeriodoEvaluacion)
    private readonly periodo_repo: Repository<PeriodoEvaluacion>,
    @InjectRepository(Evaluador)
    private readonly evaluador_repo: Repository<Evaluador>,
    @Optional()
    @InjectRepository(HorarioApoyo)
    private readonly horario_repo?: Repository<HorarioApoyo>,
    @Optional()
    @InjectRepository(AsignacionPractica)
    private readonly asignacion_repo?: Repository<AsignacionPractica>,
    @Optional()
    @InjectRepository(TarifaTransporte)
    private readonly tarifa_repo?: Repository<TarifaTransporte>,
    @Optional()
    @InjectRepository(ParadaTransporte)
    private readonly parada_repo?: Repository<ParadaTransporte>,
    @Optional()
    @InjectRepository(Evento)
    private readonly evento_repo?: Repository<Evento>,
    @Optional()
    @InjectRepository(PreguntaBienestar)
    private readonly pregunta_bienestar_repo?: Repository<PreguntaBienestar>,
    @Optional()
    @InjectRepository(Cuestionario)
    private readonly cuestionario_repo?: Repository<Cuestionario>,
    @Optional()
    @InjectRepository(PreguntaCuestionario)
    private readonly pregunta_cuestionario_repo?: Repository<PreguntaCuestionario>,
  ) {}

  async onModuleInit() {
    try {
      const cantidad_usuarios = await this.usuario_repo.count();
      if (cantidad_usuarios === 0) {
        this.logger.log('Base de datos limpia detectada al inicio. Asegurando Administrador Primario y catálogos base...');
        await this.asegurarAdministradorPrimario();
        await this.sembrarCatalogos();
        await this.sembrarCuestionarios();
      } else {
        await this.asegurarAdministradorPrimario();
      }
    } catch (error: any) {
      this.logger.warn(`No se pudo verificar la semilla automática en inicio: ${error.message}`);
    }
  }

  /**
   * Asegura la existencia del Administrador Primario en la base de datos
   * utilizando los valores definidos en las variables de entorno (.env).
   */
  async asegurarAdministradorPrimario(): Promise<Usuario> {
    const raw_nombre = process.env.ADMIN_PRIMARIO_NOMBRE || 'Administrador Primario BUMAND';
    const nombre_admin = raw_nombre.replace(/^["']|["']$/g, '').trim();
    const correo_admin = (process.env.ADMIN_PRIMARIO_CORREO || 'admin@bumand.bo').trim().toLowerCase();
    const clave_admin = process.env.ADMIN_PRIMARIO_CONTRASENA || 'Admin2026!';

    let admin = await this.usuario_repo.findOne({ where: { correo: correo_admin } });
    if (!admin) {
      admin = this.usuario_repo.create({
        nombre: nombre_admin,
        correo: correo_admin,
        contrasena_hash: await hashearContrasena(clave_admin),
        rol: Rol.ADMINISTRADOR,
        estado: EstadoUsuario.ACTIVO,
        correo_confirmado: true,
      });
      admin = await this.usuario_repo.save(admin);
      this.logger.log(`Administrador Primario creado desde .env: ${correo_admin} ("${nombre_admin}")`);
    } else {
      admin.nombre = nombre_admin;
      admin.rol = Rol.ADMINISTRADOR;
      admin.estado = EstadoUsuario.ACTIVO;
      admin.correo_confirmado = true;
      if (clave_admin) {
        admin.contrasena_hash = await hashearContrasena(clave_admin);
      }
      admin = await this.usuario_repo.save(admin);
      this.logger.log(`Administrador Primario sincronizado desde .env: ${correo_admin}`);
    }
    return admin;
  }

  /**
   * Limpieza Tipo 1: Elimina todos los datos operativos y declaraciones pasadas,
   * preservando íntegros a los usuarios (admins, supervisores, becarios) y los catálogos.
   */
  async limpiarDatosOperativos(): Promise<void> {
    this.logger.log('Iniciando limpieza de datos operativos y transaccionales (preservando usuarios y catálogos)...');

    const tablas_operativas = [
      'recorridos',
      'solicitudes_pasajes',
      'multas',
      'registros_asistencia',
      'justificaciones',
      'casos_seguimiento_pastoral',
      'evaluaciones_pastor',
      'evaluaciones',
      'asistencias_eventos',
      'refrigerios',
      'aprobaciones_practicas',
      'reportes_generados',
      'notificaciones',
    ];

    for (const tabla of tablas_operativas) {
      try {
        await this.dataSource.query(`TRUNCATE TABLE "${tabla}" CASCADE;`);
      } catch (err: any) {
        try {
          await this.dataSource.query(`DELETE FROM "${tabla}";`);
        } catch (del_err: any) {
          this.logger.warn(`No se pudo vaciar la tabla ${tabla}: ${del_err.message}`);
        }
      }
    }

    this.logger.log('Limpieza de datos operativos completada. Declaraciones pasadas y registros operativos eliminados.');
  }

  /**
   * Limpieza Tipo 2 (Enfoque B): Limpieza total de todas las tablas de datos y usuarios.
   * Deja la base de datos limpia y crea de inmediato al Administrador Primario del .env.
   */
  async limpiarTodo(): Promise<void> {
    this.logger.log('Iniciando limpieza total de la base de datos (Enfoque B: hoja en blanco)...');

    const todas_las_tablas = [
      'recorridos',
      'solicitudes_pasajes',
      'multas',
      'registros_asistencia',
      'justificaciones',
      'casos_seguimiento_pastoral',
      'evaluaciones_pastor',
      'evaluaciones',
      'asistencias_eventos',
      'eventos',
      'refrigerios',
      'aprobaciones_practicas',
      'reportes_generados',
      'notificaciones',
      'devocionales',
      'horarios_apoyo',
      'asignaciones_practica',
      'becarios',
      'evaluadores',
      'preguntas_cuestionario',
      'cuestionarios',
      'preguntas_bienestar',
      'tarifas_transporte',
      'paradas_transporte',
      'periodos_evaluaciones',
      'modulos_evaluacion',
      'lugares_practica',
      'iglesias',
      'configuraciones_institucionales',
      'usuarios',
    ];

    for (const tabla of todas_las_tablas) {
      try {
        await this.dataSource.query(`TRUNCATE TABLE "${tabla}" RESTART IDENTITY CASCADE;`);
      } catch (err: any) {
        try {
          await this.dataSource.query(`DELETE FROM "${tabla}";`);
        } catch (del_err: any) {
          this.logger.warn(`No se pudo vaciar la tabla ${tabla}: ${del_err.message}`);
        }
      }
    }

    // Tras la limpieza total, se crea al Administrador Primario desde .env
    const admin = await this.asegurarAdministradorPrimario();
    this.logger.log(
      `Limpieza total completada. La base de datos contiene únicamente al Administrador Primario configurado en .env: ${admin.correo}`,
    );
  }

  /**
   * Siembra de catálogos estructurales e institucionales del sistema:
   * Módulos de evaluación, periodos semestrales, lugares de práctica, iglesias, tarifas y paradas.
   */
  async sembrarCatalogos(): Promise<void> {
    this.logger.log('Sembrando catálogos institucionales base...');

    // 1. Módulos de evaluación canónicos
    const modulos_defecto = [
      { id: 1, nombre: 'Liderazgo en la Iglesia', descripcion: 'Evaluación realizada por el pastor de la congregación (formulario F-03)', orden: 1 },
      { id: 2, nombre: 'Autoevaluación Académica', descripcion: 'Autoevaluación del becario sobre su desempeño y avance universitario', orden: 2 },
      { id: 3, nombre: 'Evaluación del Mentor', descripcion: 'Evaluación cualitativa y cuantitativa por el supervisor/mentor asignado', orden: 3 },
      { id: 4, nombre: 'Evaluación Escuela de Líderes', descripcion: 'Evaluación del facilitador sobre la participación formativa diaconal', orden: 4 },
      { id: 5, nombre: 'Evaluación Socioeconómica', descripcion: 'Evaluación y seguimiento periódico por trabajo social institucional', orden: 5 },
    ];
    for (const m of modulos_defecto) {
      const existe_mod = await this.modulo_repo.findOne({ where: { id: m.id } });
      if (!existe_mod) {
        await this.modulo_repo.save(this.modulo_repo.create(m));
      }
    }

    // 2. Periodos semestrales
    const periodos_defecto = [
      { id: 1, nombre: 'Semestre I - 2026', fecha_inicio: new Date('2026-01-01'), fecha_fin: new Date('2026-06-30'), estado: EstadoPeriodo.CERRADO },
      { id: 2, nombre: 'Semestre II - 2026', fecha_inicio: new Date('2026-07-01'), fecha_fin: new Date('2026-12-31'), estado: EstadoPeriodo.ABIERTO },
    ];
    for (const p of periodos_defecto) {
      const existe_per = await this.periodo_repo.findOne({ where: { id: p.id } });
      if (!existe_per) {
        await this.periodo_repo.save(this.periodo_repo.create(p));
      }
    }

    // 3. Lugares de práctica
    const agencias_datos = [
      {
        nombre: 'Oficina Central Diaconía IFD - El Alto',
        direccion: 'Av. Juan Pablo II esq. Calle Sbtte. Jorge Eulert 125, El Alto',
        latitud: -16.500054,
        longitud: -68.173455,
        radio_tolerancia_m: 60,
      },
      {
        nombre: 'Sucursal La Paz - San Pedro',
        direccion: 'Calle Colombia N° 450 esq. Cañada Strongest, Zona San Pedro, La Paz',
        latitud: -16.501500,
        longitud: -68.138200,
        radio_tolerancia_m: 50,
      },
      {
        nombre: 'Agencia Chasquipampa',
        direccion: 'Calle 53 esq. Av. Principal Chasquipampa, Zona Sur, La Paz',
        latitud: -16.541200,
        longitud: -68.061100,
        radio_tolerancia_m: 50,
      },
      {
        nombre: 'Agencia Viacha',
        direccion: 'Plaza Principal José Ballivián N° 85, Viacha',
        latitud: -16.652100,
        longitud: -68.301500,
        radio_tolerancia_m: 60,
      },
      {
        nombre: 'Agencia Laguna San Pedro',
        direccion: 'Calle Boquerón N° 120 esq. Almirante Grau, La Paz',
        latitud: -16.502800,
        longitud: -68.136900,
        radio_tolerancia_m: 50,
      },
      {
        nombre: 'Agencia Puente Seco',
        direccion: 'Av. Juan Pablo II, Altura Ceja de El Alto',
        latitud: -16.512000,
        longitud: -68.179500,
        radio_tolerancia_m: 50,
      },
      {
        nombre: 'Agencia Franz Tamayo',
        direccion: 'Av. Franz Tamayo N° 230, Villa Adela, El Alto',
        latitud: -16.529800,
        longitud: -68.192300,
        radio_tolerancia_m: 50,
      },
      {
        nombre: 'Agencia Villa Dolores',
        direccion: 'Plaza Juana Azurduy de Padilla N° 40, El Alto',
        latitud: -16.516500,
        longitud: -68.161000,
        radio_tolerancia_m: 50,
      },
      {
        nombre: 'Agencia Senkata',
        direccion: 'Av. 6 de Marzo Km 14, Senkata, El Alto',
        latitud: -16.568000,
        longitud: -68.175000,
        radio_tolerancia_m: 60,
      },
      {
        nombre: 'Agencia Río Seco',
        direccion: 'Av. Juan Pablo II, Ex-Tranca Río Seco, El Alto',
        latitud: -16.488000,
        longitud: -68.195000,
        radio_tolerancia_m: 50,
      },
      {
        nombre: 'Agencia Ciudad Satélite',
        direccion: 'Av. del Policía esq. Calle 14, Ciudad Satélite, El Alto',
        latitud: -16.518000,
        longitud: -68.148000,
        radio_tolerancia_m: 50,
      },
    ];
    for (const ag of agencias_datos) {
      let lugar = await this.lugar_repo.findOne({ where: { nombre: ag.nombre } });
      if (!lugar) {
        lugar = this.lugar_repo.create(ag);
        await this.lugar_repo.save(lugar);
      }
    }

    // 4. Iglesias institucionales y evaluadores pastorales
    for (const igl_data of IGLESIAS_SEMILLA) {
      let iglesia = await this.iglesia_repo.findOne({ where: { nombre: igl_data.nombre } });
      if (!iglesia) {
        iglesia = this.iglesia_repo.create({
          nombre: igl_data.nombre,
          direccion: igl_data.direccion,
          latitud: igl_data.latitud ?? null,
          longitud: igl_data.longitud ?? null,
          radio_tolerancia_m: igl_data.radio_tolerancia_m ?? 60,
          pastor_nombre: igl_data.pastor,
          pastor_telefono: igl_data.telefono,
          pastor_correo: igl_data.pastor_correo ?? null,
        });
        await this.iglesia_repo.save(iglesia);
      }

      if (igl_data.pastor) {
        let evaluador_pastor = await this.evaluador_repo.findOne({
          where: { nombre: igl_data.pastor, tipo: TipoEvaluador.PASTOR },
        });
        if (!evaluador_pastor) {
          evaluador_pastor = this.evaluador_repo.create({
            nombre: igl_data.pastor,
            tipo: TipoEvaluador.PASTOR,
            correo: igl_data.pastor_correo || `pastor.${igl_data.pastor.toLowerCase().replace(/[^a-z0-9]/g, '.')}@diaconia.bo`.replace(/\.+/g, '.'),
            telefono: igl_data.telefono || '70000000',
          });
          await this.evaluador_repo.save(evaluador_pastor);
        }
      }
    }

    // Evaluadores genéricos del sistema
    let evaluador_becario = await this.evaluador_repo.findOne({ where: { tipo: TipoEvaluador.BECARIO } });
    if (!evaluador_becario) {
      await this.evaluador_repo.save(
        this.evaluador_repo.create({
          nombre: 'Autoevaluación Becario',
          tipo: TipoEvaluador.BECARIO,
          correo: 'becario@diaconia.bo',
        }),
      );
    }

    let evaluador_social = await this.evaluador_repo.findOne({ where: { tipo: TipoEvaluador.TRABAJADOR_SOCIAL } });
    if (!evaluador_social) {
      await this.evaluador_repo.save(
        this.evaluador_repo.create({
          nombre: 'Trabajador Social Diaconía',
          tipo: TipoEvaluador.TRABAJADOR_SOCIAL,
          correo: 'social@diaconia.bo',
        }),
      );
    }

    // 5. Tarifas de transporte
    if (this.tarifa_repo) {
      const cuenta_tarifas = await this.tarifa_repo.count();
      if (cuenta_tarifas === 0) {
        const tarifas_oficiales = [
          { medio_transporte: 'Micro / Colectivo Urbano', descripcion: 'Ruta regular La Paz / El Alto', costo_bs: 2.00, tramo_tipo: 'urbano' },
          { medio_transporte: 'Minibús Tramo Corto', descripcion: 'Parada intermedia o tramo corto', costo_bs: 2.00, tramo_tipo: 'urbano' },
          { medio_transporte: 'Minibús Tramo Directo', descripcion: 'Ruta directa troncal urbana', costo_bs: 2.60, tramo_tipo: 'urbano' },
          { medio_transporte: 'Mi Teleférico', descripcion: 'Línea de red por tramo', costo_bs: 3.00, tramo_tipo: 'interciudad' },
          { medio_transporte: 'Minibús Interciudad / El Alto', descripcion: 'Tramo La Paz - El Alto o extralargo', costo_bs: 3.50, tramo_tipo: 'interciudad' },
          { medio_transporte: 'Trufi Troncal', descripcion: 'Ruta fija troncal', costo_bs: 4.00, tramo_tipo: 'urbano' },
        ];
        for (const t of tarifas_oficiales) {
          await this.tarifa_repo.save(this.tarifa_repo.create({ ...t, activo: true }));
        }
      }
    }

    // 6. Paradas oficiales
    if (this.parada_repo) {
      for (const p of PARADAS_OFICIALES_DEFECTO) {
        const existe_parada = await this.parada_repo.findOne({ where: { nombre: p.nombre } });
        if (!existe_parada) {
          await this.parada_repo.save(this.parada_repo.create(p));
        }
      }
    }

    this.logger.log('Catálogos institucionales sembrados exitosamente.');
  }

  /**
   * Siembra de cuestionarios dinámicos y preguntas institucionales.
   */
  async sembrarCuestionarios(): Promise<void> {
    this.logger.log('Sembrando cuestionarios dinámicos y preguntas de evaluación...');

    // 1. Preguntas de bienestar en su tabla canónica
    if (this.pregunta_bienestar_repo) {
      const cuenta_preguntas = await this.pregunta_bienestar_repo.count();
      if (cuenta_preguntas === 0) {
        for (const p of PREGUNTAS_BIENESTAR_DEFECTO) {
          await this.pregunta_bienestar_repo.save(this.pregunta_bienestar_repo.create(p));
        }
      }
    }

    // 2. Cuestionarios en la tabla general `cuestionarios`
    if (this.cuestionario_repo && this.pregunta_cuestionario_repo) {
      // a) Bienestar Universitario
      let c_bienestar = await this.cuestionario_repo.findOne({ where: { codigo: 'BIENESTAR_ESTUDIANTIL' } });
      if (!c_bienestar) {
        c_bienestar = await this.cuestionario_repo.save(
          this.cuestionario_repo.create({
            codigo: 'BIENESTAR_ESTUDIANTIL',
            titulo: 'Cuestionario de Bienestar Universitario',
            descripcion: 'Instrumento de seguimiento integral psicosocial, espiritual y académico para estudiantes becarios BUMAND.',
            tipo_evaluador: 'becario',
            modulo_id: 5,
            activo: true,
          }),
        );
        for (const p of PREGUNTAS_BIENESTAR_DEFECTO) {
          await this.pregunta_cuestionario_repo.save(
            this.pregunta_cuestionario_repo.create({
              cuestionario_id: c_bienestar.id,
              numero_orden: p.numero_orden,
              seccion: p.categoria || 'Bienestar Integral',
              titulo: p.titulo,
              enunciado: p.enunciado,
              tipo_pregunta: 'likert',
              opciones: p.opciones as any,
              peso_puntos: 1.0,
              obligatoria: true,
              activa: true,
            }),
          );
        }
      }

      // b) Formulario F-03 Pastoral
      let c_pastoral = await this.cuestionario_repo.findOne({ where: { codigo: 'F03_PASTORAL' } });
      if (!c_pastoral) {
        c_pastoral = await this.cuestionario_repo.save(
          this.cuestionario_repo.create({
            codigo: 'F03_PASTORAL',
            titulo: 'Formulario F-03: Evaluación Pastoral y Vida Eclesial',
            descripcion: 'Evaluación cualitativa y cuantitativa emitida por el pastor de la iglesia local sobre liderazgo y testimonio.',
            tipo_evaluador: 'pastor',
            modulo_id: 1,
            activo: true,
          }),
        );

        const preguntas_pastoral = [
          {
            numero_orden: 1,
            seccion: 'Vida Espiritual y Devocional',
            titulo: 'Consistencia en la oración y lectura bíblica',
            enunciado: '¿El becario demuestra madurez y constancia en su vida devocional diaria y comunitaria?',
            tipo_pregunta: 'likert',
            opciones: [
              { inciso: 'A', texto: 'Sobresaliente / Modelo para la congregación', puntaje: 100 },
              { inciso: 'B', texto: 'Constante y comprometido', puntaje: 85 },
              { inciso: 'C', texto: 'Regular / Requiere acompañamiento', puntaje: 65 },
              { inciso: 'D', texto: 'Intermitente o ausente', puntaje: 40 },
            ],
          },
          {
            numero_orden: 2,
            seccion: 'Asistencia y Participación en Cultos',
            titulo: 'Puntualidad y asistencia a cultos dominicales y reuniones',
            enunciado: '¿Asiste puntualmente y participa activamente en los cultos semanales y actividades convocadas?',
            tipo_pregunta: 'likert',
            opciones: [
              { inciso: 'A', texto: 'Asistencia 100% puntual y activa', puntaje: 100 },
              { inciso: 'B', texto: 'Asistencia regular con justificaciones válidas', puntaje: 85 },
              { inciso: 'C', texto: 'Inasistencias esporádicas sin aviso', puntaje: 60 },
              { inciso: 'D', texto: 'Falta constante a las reuniones eclesiales', puntaje: 30 },
            ],
          },
          {
            numero_orden: 3,
            seccion: 'Liderazgo y Servicio Diaconal',
            titulo: 'Responsabilidad en ministerios y servicio congregacional',
            enunciado: '¿Ejerce liderazgo con vocación de servicio diaconal, puntualidad y buen testimonio?',
            tipo_pregunta: 'likert',
            opciones: [
              { inciso: 'A', texto: 'Liderazgo activo y propositivo', puntaje: 100 },
              { inciso: 'B', texto: 'Cumple fielmente con sus asignaciones', puntaje: 85 },
              { inciso: 'C', texto: 'Participación pasiva en los ministerios', puntaje: 60 },
              { inciso: 'D', texto: 'Sin involucramiento en ministerios', puntaje: 25 },
            ],
          },
        ];

        for (const pp of preguntas_pastoral) {
          await this.pregunta_cuestionario_repo.save(
            this.pregunta_cuestionario_repo.create({
              cuestionario_id: c_pastoral.id,
              numero_orden: pp.numero_orden,
              seccion: pp.seccion,
              titulo: pp.titulo,
              enunciado: pp.enunciado,
              tipo_pregunta: pp.tipo_pregunta,
              opciones: pp.opciones as any,
              peso_puntos: 1.0,
              obligatoria: true,
              activa: true,
            }),
          );
        }
      }

      // c) Rúbrica Mentor de Prácticas
      let c_mentor = await this.cuestionario_repo.findOne({ where: { codigo: 'MENTOR_PRACTICAS' } });
      if (!c_mentor) {
        c_mentor = await this.cuestionario_repo.save(
          this.cuestionario_repo.create({
            codigo: 'MENTOR_PRACTICAS',
            titulo: 'Rúbrica de Evaluación de Prácticas y Tutoría Institucional',
            descripcion: 'Evaluación de desempeño, puntualidad, ética y competencias profesionales por el tutor/mentor de Diaconía.',
            tipo_evaluador: 'supervisor',
            modulo_id: 3,
            activo: true,
          }),
        );

        const criterios_mentor = [
          {
            numero_orden: 1,
            seccion: 'Desempeño y Calidad Técnica',
            titulo: 'Calidad en las labores asignadas en sede',
            enunciado: '¿El becario demuestra solvencia técnica y calidad en las tareas de su unidad?',
            tipo_pregunta: 'likert',
            opciones: [
              { inciso: '5', texto: 'Excelente / Supera expectativas', puntaje: 100 },
              { inciso: '4', texto: 'Muy Bueno / Cumplimiento óptimo', puntaje: 85 },
              { inciso: '3', texto: 'Bueno / Cumple el estándar básico', puntaje: 70 },
              { inciso: '2', texto: 'Aceptable con observaciones', puntaje: 55 },
              { inciso: '1', texto: 'Deficiente / No cumple', puntaje: 30 },
            ],
          },
          {
            numero_orden: 2,
            seccion: 'Puntualidad y Compromiso',
            titulo: 'Cumplimiento de horario de apoyo institucional',
            enunciado: '¿Registra sus marcaciones a tiempo y cumple la carga horaria comprometida?',
            tipo_pregunta: 'likert',
            opciones: [
              { inciso: '5', texto: 'Puntualidad intachable (0 retrasos)', puntaje: 100 },
              { inciso: '4', texto: 'Puntual con retrasos justificados', puntaje: 85 },
              { inciso: '3', texto: 'Retrasos menores esporádicos', puntaje: 70 },
              { inciso: '2', texto: 'Inasistencias o retrasos frecuentes', puntaje: 50 },
              { inciso: '1', texto: 'Incumplimiento grave de horario', puntaje: 20 },
            ],
          },
        ];

        for (const cm of criterios_mentor) {
          await this.pregunta_cuestionario_repo.save(
            this.pregunta_cuestionario_repo.create({
              cuestionario_id: c_mentor.id,
              numero_orden: cm.numero_orden,
              seccion: cm.seccion,
              titulo: cm.titulo,
              enunciado: cm.enunciado,
              tipo_pregunta: cm.tipo_pregunta,
              opciones: cm.opciones as any,
              peso_puntos: 1.0,
              obligatoria: true,
              activa: true,
            }),
          );
        }
      }

      // d) Escuela de Líderes y Formación Teológica CETI (Módulo 4)
      let c_lideres = await this.cuestionario_repo.findOne({ where: { codigo: 'ESCUELA_LIDERES_CETI' } });
      if (!c_lideres) {
        c_lideres = await this.cuestionario_repo.save(
          this.cuestionario_repo.create({
            codigo: 'ESCUELA_LIDERES_CETI',
            titulo: 'Escuela de Líderes: Formación Teológica y Servicio CETI',
            descripcion: 'Catálogo de las 12 tareas teológicas, ponderación individual y baremo de asistencia presencial de los viernes.',
            tipo_evaluador: 'facilitador',
            modulo_id: 4,
            activo: true,
          }),
        );

        const tareas_ceti = [
          { numero: 1, tema: 'Liderazgo Servidor y Mayordomía Cristiana', ponderacion: 8.33 },
          { numero: 2, tema: 'Misión Integral y Vocación Diaconal', ponderacion: 8.33 },
          { numero: 3, tema: 'Ética Profesional en el Ámbito Financiero y Social', ponderacion: 8.33 },
          { numero: 4, tema: 'Acompañamiento a Grupos Vulnerables', ponderacion: 8.33 },
          { numero: 5, tema: 'Resolución de Conflictos en la Comunidad Eclesial', ponderacion: 8.33 },
          { numero: 6, tema: 'Diseño y Planificación de Proyectos de Servicio', ponderacion: 8.33 },
          { numero: 7, tema: 'Oración, Intercesión y Vida Devocional Comunitaria', ponderacion: 8.33 },
          { numero: 8, tema: 'Comunicación Asertiva y Testimonio Universitario', ponderacion: 8.33 },
          { numero: 9, tema: 'Finanzas Personales Bíblicas y Responsabilidad', ponderacion: 8.33 },
          { numero: 10, tema: 'Salud Mental y Manejo del Estrés en Época Académica', ponderacion: 8.33 },
          { numero: 11, tema: 'Discipulado Generacional y Mentoría a Nuevos Becarios', ponderacion: 8.33 },
          { numero: 12, tema: 'Evaluación Integral de Impacto Comunitario', ponderacion: 8.37 },
        ];

        for (const t of tareas_ceti) {
          await this.pregunta_cuestionario_repo.save(
            this.pregunta_cuestionario_repo.create({
              cuestionario_id: c_lideres.id,
              numero_orden: t.numero,
              seccion: 'Tareas Teológicas Semestrales CETI',
              titulo: t.tema,
              enunciado: `Presentación y aprobación de informe práctico sobre "${t.tema}".`,
              tipo_pregunta: 'escala_numerica',
              opciones: [
                { inciso: 'Aprobado', texto: 'Tarea presentada con solvencia y aplicabilidad práctica', puntaje: 100 },
                { inciso: 'Regular', texto: 'Presentación parcial con observaciones teológicas', puntaje: 70 },
                { inciso: 'No Presentado', texto: 'Incumplimiento de entrega en la fecha convocada', puntaje: 0 },
              ],
              peso_puntos: t.ponderacion,
              obligatoria: true,
              activa: true,
            }),
          );
        }
      }
    }

    this.logger.log('Cuestionarios y preguntas institucionales sembrados exitosamente.');
  }

  /**
   * Siembra Completa Institucional (sembrar):
   * Siembra Administrador Primario, administradores institucionales, supervisores,
   * catálogos, cuestionarios y los 23 becarios de la nómina oficial.
   * GARANTIZA QUE NO SE SIEMBRE NINGÚN PASAJE NI RECORRIDO SIMULADO.
   */
  async ejecutarSemilla(): Promise<void> {
    this.logger.log('Iniciando siembra exhaustiva institucional de BUMAND...');

    // 1. Asegurar Administrador Primario desde .env
    const admin_primario = await this.asegurarAdministradorPrimario();

    // 2. Administradores Institucionales
    const mapa_administradores = new Map<string, Usuario>();
    mapa_administradores.set(admin_primario.correo, admin_primario);

    for (const admin of ADMINISTRADORES_SEMILLA) {
      let usuario_admin = await this.usuario_repo.findOne({ where: { correo: admin.correo } });
      if (!usuario_admin) {
        usuario_admin = this.usuario_repo.create({
          nombre: admin.nombre,
          correo: admin.correo,
          contrasena_hash: await hashearContrasena(admin.clave),
          rol: Rol.ADMINISTRADOR,
          estado: EstadoUsuario.ACTIVO,
          correo_confirmado: true,
        });
        usuario_admin = await this.usuario_repo.save(usuario_admin);
      } else {
        usuario_admin.nombre = admin.nombre;
        usuario_admin.rol = Rol.ADMINISTRADOR;
        usuario_admin.estado = EstadoUsuario.ACTIVO;
        usuario_admin.correo_confirmado = true;
        usuario_admin = await this.usuario_repo.save(usuario_admin);
      }
      mapa_administradores.set(admin.correo, usuario_admin);
    }

    // 3. Catálogos y Cuestionarios
    await this.sembrarCatalogos();
    await this.sembrarCuestionarios();

    // 4. Supervisores Institucionales
    const mapa_supervisores = new Map<string, Usuario>();
    for (const sup of SUPERVISORES_SEMILLA) {
      let usuario_sup = await this.usuario_repo.findOne({ where: { correo: sup.correo } });
      if (!usuario_sup) {
        usuario_sup = this.usuario_repo.create({
          nombre: sup.nombre,
          correo: sup.correo,
          contrasena_hash: await hashearContrasena(sup.clave),
          rol: Rol.SUPERVISOR,
          estado: EstadoUsuario.ACTIVO,
          correo_confirmado: true,
        });
        usuario_sup = await this.usuario_repo.save(usuario_sup);
      } else {
        usuario_sup.nombre = sup.nombre;
        usuario_sup.rol = Rol.SUPERVISOR;
        usuario_sup.estado = EstadoUsuario.ACTIVO;
        usuario_sup.correo_confirmado = true;
        usuario_sup = await this.usuario_repo.save(usuario_sup);
      }
      mapa_supervisores.set(sup.correo, usuario_sup);

      let evaluador_sup = await this.evaluador_repo.findOne({ where: { correo: sup.correo } });
      if (!evaluador_sup) {
        evaluador_sup = this.evaluador_repo.create({
          nombre: sup.nombre,
          tipo: TipoEvaluador.SUPERVISOR,
          correo: sup.correo,
          telefono: sup.telefono,
        });
        await this.evaluador_repo.save(evaluador_sup);
      }
    }

    // 5. Nómina Oficial de Becarios (23 Estudiantes)
    const supervisor_por_defecto = mapa_supervisores.get('angel.ali@bumand.bo') || Array.from(mapa_supervisores.values())[0];
    const lugar_central = await this.lugar_repo.findOne({ where: { nombre: 'Oficina Central Diaconía IFD - El Alto' } }) || await this.lugar_repo.findOne({ where: {} });
    const iglesia_central = await this.iglesia_repo.findOne({ where: { nombre: 'Iglesia Central El Alto' } }) || await this.iglesia_repo.findOne({ where: {} });

    for (const b_semilla of BECARIOS_SEMILLA) {
      let usuario_becario = await this.usuario_repo.findOne({ where: { correo: b_semilla.correo } });
      if (!usuario_becario) {
        usuario_becario = this.usuario_repo.create({
          nombre: b_semilla.nombre,
          correo: b_semilla.correo,
          contrasena_hash: await hashearContrasena(b_semilla.clave || 'Bumand2026!'),
          rol: Rol.BECARIO,
          estado: EstadoUsuario.ACTIVO,
          correo_confirmado: true,
        });
        usuario_becario = await this.usuario_repo.save(usuario_becario);
      } else {
        usuario_becario.nombre = b_semilla.nombre;
        usuario_becario.rol = Rol.BECARIO;
        usuario_becario.estado = EstadoUsuario.ACTIVO;
        usuario_becario.correo_confirmado = true;
        usuario_becario = await this.usuario_repo.save(usuario_becario);
      }

      let supervisor_asignado = b_semilla.supervisor_correo
        ? mapa_supervisores.get(b_semilla.supervisor_correo)
        : null;
      if (!supervisor_asignado) supervisor_asignado = supervisor_por_defecto;

      let iglesia_asignada: Iglesia | null = null;
      if (b_semilla.iglesia_nombre) {
        iglesia_asignada = await this.iglesia_repo.findOne({ where: { nombre: b_semilla.iglesia_nombre } });
      }
      if (!iglesia_asignada) iglesia_asignada = iglesia_central;

      let becario_existente = await this.becario_repo.findOne({
        where: [{ usuario_id: usuario_becario.id }, { ci: b_semilla.ci }],
      });

      const datos_perfil = {
        usuario_id: usuario_becario.id,
        nombre: b_semilla.nombre,
        ci: b_semilla.ci,
        lugar_expedicion: b_semilla.lugar_expedicion || null,
        estado_civil: b_semilla.estado_civil || null,
        sexo: b_semilla.sexo || null,
        ceti: b_semilla.ceti !== undefined ? b_semilla.ceti : null,
        celular: b_semilla.celular || null,
        fecha_nacimiento: b_semilla.fecha_nacimiento || null,
        edad: b_semilla.edad !== undefined ? b_semilla.edad : null,
        direccion: b_semilla.direccion || null,
        ciudad: b_semilla.ciudad || null,
        carrera: b_semilla.carrera,
        universidad: b_semilla.universidad,
        institucion: b_semilla.institucion || 'Diaconía FRIF-IFD',
        unidad: b_semilla.unidad,
        ubicacion: b_semilla.ubicacion || null,
        fecha_ingreso: new Date('2026-01-15'),
        lugar_practica_id: lugar_central ? lugar_central.id : null,
        iglesia_id: iglesia_asignada ? iglesia_asignada.id : null,
        supervisor_id: supervisor_asignado ? supervisor_asignado.id : null,
        horario_semanal: b_semilla.horario_semanal || null,
        datos_confirmados: true,
        datos_validados: true,
        fecha_ultima_confirmacion: new Date('2026-01-15'),
        modalidad_carrera: b_semilla.modalidad_carrera || null,
        tipo_beca: b_semilla.tipo_beca || null,
        comentario_academico: b_semilla.comentario_academico || null,
        comentario_iglesia: b_semilla.comentario_iglesia || null,
      };

      let becario_guardado: Becario;
      if (!becario_existente) {
        becario_guardado = await this.becario_repo.save(
          this.becario_repo.create({
            ...datos_perfil,
            usuario: usuario_becario,
          }),
        );
      } else {
        Object.assign(becario_existente, datos_perfil);
        becario_guardado = await this.becario_repo.save(becario_existente);
      }

      // Formalización de Horarios de Apoyo
      if (this.horario_repo && b_semilla.horario_semanal) {
        const mapa_dias: Record<string, number> = {
          domingo: 0, dom: 0,
          lunes: 1, lun: 1,
          martes: 2, mar: 2,
          miercoles: 3, miércoles: 3, mie: 3,
          jueves: 4, jue: 4,
          viernes: 5, vie: 5,
          sabado: 6, sábado: 6, sab: 6,
        };
        for (const [clave_dia, rango] of Object.entries(b_semilla.horario_semanal)) {
          const dia_idx = mapa_dias[clave_dia.toLowerCase()];
          if (dia_idx !== undefined && typeof rango === 'string' && rango.includes('-')) {
            const [h_ini, h_fin] = rango.split('-').map((s) => s.trim());
            let horario_db = await this.horario_repo.findOne({
              where: { becario_id: becario_guardado.id, dia_semana: dia_idx },
            });
            if (!horario_db) {
              horario_db = this.horario_repo.create({
                becario_id: becario_guardado.id,
                dia_semana: dia_idx,
                hora_inicio: h_ini,
                hora_fin: h_fin,
                horas_diarias: 4.0,
                turno: 'mañana',
                activo: true,
              });
            } else {
              horario_db.hora_inicio = h_ini;
              horario_db.hora_fin = h_fin;
              horario_db.activo = true;
            }
            await this.horario_repo.save(horario_db);
          }
        }
      }

      // Asignación de práctica
      if (this.asignacion_repo && lugar_central) {
        let asignacion_db = await this.asignacion_repo.findOne({
          where: { becario_id: becario_guardado.id, lugar_practica_id: lugar_central.id },
        });
        if (!asignacion_db) {
          asignacion_db = this.asignacion_repo.create({
            becario_id: becario_guardado.id,
            lugar_practica_id: lugar_central.id,
            supervisor_id: supervisor_asignado ? supervisor_asignado.id : null,
            area_departamento: b_semilla.unidad || 'Oficina Central',
            fecha_inicio: new Date('2026-01-15'),
            estado: 'vigente',
          });
          await this.asignacion_repo.save(asignacion_db);
        }
      }

      // Registrar evaluador becario para autoevaluación
      let evaluador_bec = await this.evaluador_repo.findOne({ where: { correo: b_semilla.correo } });
      if (!evaluador_bec) {
        evaluador_bec = this.evaluador_repo.create({
          nombre: b_semilla.nombre,
          tipo: TipoEvaluador.BECARIO,
          correo: b_semilla.correo,
          telefono: '70000000',
        });
        await this.evaluador_repo.save(evaluador_bec);
      }
    }

    // 6. Evento institucional semilla
    if (this.evento_repo) {
      const titulo_evento_semilla = 'Encuentro de Liderazgo y Acción Diaconal';
      let evento_semilla = await this.evento_repo.findOne({ where: { titulo: titulo_evento_semilla } });
      if (!evento_semilla) {
        evento_semilla = this.evento_repo.create({
          creador_id: admin_primario.id,
          titulo: titulo_evento_semilla,
          descripcion: 'Jornada intensiva de formación en liderazgo cristiano, servicio social diaconal e integración formativa de becarios.',
          tipo_evento: TipoEvento.ESCUELA_LIDERES_ESPECIAL,
          fecha: new Date('2026-10-25'),
          hora_inicio: '08:30',
          hora_fin: '13:30',
          latitud: -16.500054,
          longitud: -68.173455,
          radio_tolerancia_m: 100,
          direccion_referencia: 'Oficina Central Diaconía IFD, Av. Juan Pablo II esq. Calle Sbtte. Jorge Eulert 125, El Alto',
          estado: EstadoEvento.PROGRAMADO,
        });
        await this.evento_repo.save(evento_semilla);
      }
    }

    // 7. HIGIENE ESTRICTA: Garantizar que NO se siembren ni existan pasajes simulados
    try {
      await this.dataSource.query('TRUNCATE TABLE "recorridos", "solicitudes_pasajes" CASCADE;');
    } catch (_) {
      try {
        await this.dataSource.query('DELETE FROM "recorridos";');
        await this.dataSource.query('DELETE FROM "solicitudes_pasajes";');
      } catch (err: any) {
        this.logger.warn(`Advertencia al vaciar pasajes simulados: ${err.message}`);
      }
    }
    this.logger.log('Higiene de pasajes confirmada: Cero pasajes declarados simulados en la base de datos.');

    this.logger.log(
      `Siembra institucional completada exitosamente. Administrador Primario: ${admin_primario.correo}, ${BECARIOS_SEMILLA.length} becarios registrados.`,
    );
  }
}

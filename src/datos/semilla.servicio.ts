import { Injectable, OnModuleInit, Logger, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
  ) {}

  async onModuleInit() {
    try {
      await this.ejecutarSemilla();
    } catch (error: any) {
      this.logger.warn(`No se pudo ejecutar la semilla automática: ${error.message}`);
    }
  }

  async ejecutarSemilla() {
    this.logger.log('Iniciando verificación y siembra exhaustiva de datos institucionales de BUMAND...');

    // 1. Administradores Institucionales
    const mapa_administradores = new Map<string, Usuario>();
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
        this.logger.log(`Administrador creado: ${admin.correo} (${admin.nombre})`);
      } else {
        usuario_admin.nombre = admin.nombre;
        usuario_admin.rol = Rol.ADMINISTRADOR;
        usuario_admin.estado = EstadoUsuario.ACTIVO;
        usuario_admin.correo_confirmado = true;
        usuario_admin = await this.usuario_repo.save(usuario_admin);
      }
      mapa_administradores.set(admin.correo, usuario_admin);
    }

    // Depuración de cuenta genérica ficticia obsoleta si existe
    const admin_obsoleto = await this.usuario_repo.findOne({ where: { correo: 'admin@wscrt.com' } });
    if (admin_obsoleto) {
      if (this.evento_repo) {
        await this.evento_repo.update({ creador_id: admin_obsoleto.id }, { creador_id: undefined });
      }
      await this.usuario_repo.remove(admin_obsoleto);
      this.logger.log('Cuenta ficticia admin@wscrt.com eliminada permanentemente.');
    }

    // 2. Supervisores Institucionales (Tutores y Mentores de Diaconía FRIF-IFD)
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
        this.logger.log(`Supervisor creado: ${sup.correo} (${sup.nombre})`);
      } else {
        usuario_sup.nombre = sup.nombre;
        usuario_sup.rol = Rol.SUPERVISOR;
        usuario_sup.estado = EstadoUsuario.ACTIVO;
        usuario_sup.correo_confirmado = true;
        usuario_sup = await this.usuario_repo.save(usuario_sup);
      }
      mapa_supervisores.set(sup.correo, usuario_sup);

      // Registrar también en la tabla de evaluadores como supervisor/mentor
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

    let evaluador_becario = await this.evaluador_repo.findOne({ where: { tipo: TipoEvaluador.BECARIO } });
    if (!evaluador_becario) {
      evaluador_becario = this.evaluador_repo.create({
        nombre: 'Autoevaluación Becario',
        tipo: TipoEvaluador.BECARIO,
        correo: 'becario@diaconia.bo',
      });
      await this.evaluador_repo.save(evaluador_becario);
    }

    let evaluador_social = await this.evaluador_repo.findOne({ where: { tipo: TipoEvaluador.TRABAJADOR_SOCIAL } });
    if (!evaluador_social) {
      evaluador_social = this.evaluador_repo.create({
        nombre: 'Trabajador Social Diaconía',
        tipo: TipoEvaluador.TRABAJADOR_SOCIAL,
        correo: 'social@diaconia.bo',
      });
      await this.evaluador_repo.save(evaluador_social);
    }

    // 3. Lugares de práctica institucionales (Sede Central y Red de Agencias Diaconía)
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

    let lugar_central: LugarPractica | null = null;
    for (const ag of agencias_datos) {
      let lugar = await this.lugar_repo.findOne({ where: { nombre: ag.nombre } });
      if (!lugar) {
        lugar = this.lugar_repo.create(ag);
        lugar = await this.lugar_repo.save(lugar);
      }
      if (ag.nombre.includes('Central')) {
        lugar_central = lugar;
      }
    }
    if (!lugar_central) {
      lugar_central = await this.lugar_repo.findOne({ where: {} });
    }

    // 4. Iglesias institucionales y registro de Evaluadores Pastorales (Formulario F-03)
    const mapa_iglesias = new Map<string, Iglesia>();
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
        iglesia = await this.iglesia_repo.save(iglesia);
      } else {
        iglesia.direccion = igl_data.direccion;
        iglesia.latitud = igl_data.latitud ?? iglesia.latitud;
        iglesia.longitud = igl_data.longitud ?? iglesia.longitud;
        iglesia.radio_tolerancia_m = igl_data.radio_tolerancia_m ?? 60;
        iglesia.pastor_nombre = igl_data.pastor;
        iglesia.pastor_telefono = igl_data.telefono;
        iglesia.pastor_correo = igl_data.pastor_correo ?? iglesia.pastor_correo;
        iglesia = await this.iglesia_repo.save(iglesia);
      }
      mapa_iglesias.set(igl_data.nombre, iglesia);

      // Registrar evaluador pastoral
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

    // 5. Limpieza exhaustiva de usuarios de prueba o no oficiales (eliminando usuarios de prueba)
    const correos_oficiales_becarios = new Set(BECARIOS_SEMILLA.map((b) => b.correo));
    const correos_oficiales_admins = new Set(ADMINISTRADORES_SEMILLA.map((a) => a.correo));
    const correos_oficiales_supervisores = new Set(SUPERVISORES_SEMILLA.map((s) => s.correo));

    const todos_usuarios_db = await this.usuario_repo.find();
    for (const u_db of todos_usuarios_db) {
      try {
        if (u_db.rol === Rol.BECARIO && !correos_oficiales_becarios.has(u_db.correo)) {
          this.logger.log(`Depurando usuario becario de prueba/no oficial: ${u_db.correo}`);
          const bec = await this.becario_repo.findOne({ where: { usuario_id: u_db.id } });
          if (bec) await this.becario_repo.remove(bec);
          await this.usuario_repo.remove(u_db);
        } else if (u_db.rol === Rol.SUPERVISOR && !correos_oficiales_supervisores.has(u_db.correo)) {
          this.logger.log(`Depurando usuario supervisor de prueba: ${u_db.correo}`);
          await this.usuario_repo.remove(u_db);
        } else if (u_db.rol === Rol.ADMINISTRADOR && !correos_oficiales_admins.has(u_db.correo)) {
          this.logger.log(`Depurando usuario administrador de prueba: ${u_db.correo}`);
          await this.usuario_repo.remove(u_db);
        }
      } catch (err: any) {
        this.logger.warn(`No se pudo eliminar usuario obsoleto ${u_db.correo}: ${err.message}`);
      }
    }

    // 6. Siembra de todos los Estudiantes / Becarios Institucionales (23 becarios oficiales)
    const supervisor_por_defecto = mapa_supervisores.get('angel.ali@bumand.bo');

    for (const b_semilla of BECARIOS_SEMILLA) {
      // a) Crear o sincronizar usuario becario
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
        this.logger.log(`Estudiante/Becario creado: ${b_semilla.correo} (${b_semilla.nombre})`);
      } else {
        usuario_becario.nombre = b_semilla.nombre;
        if (usuario_becario.rol !== Rol.ADMINISTRADOR) {
          usuario_becario.rol = Rol.BECARIO;
        }
        usuario_becario.estado = EstadoUsuario.ACTIVO;
        usuario_becario.correo_confirmado = true;
        usuario_becario = await this.usuario_repo.save(usuario_becario);
      }

      // b) Determinar supervisor institucional asignado
      let supervisor_asignado = b_semilla.supervisor_correo
        ? mapa_supervisores.get(b_semilla.supervisor_correo)
        : null;
      if (!supervisor_asignado) {
        supervisor_asignado = supervisor_por_defecto;
      }

      // c) Determinar iglesia institucional asignada
      let iglesia_asignada: Iglesia | null = b_semilla.iglesia_nombre
        ? mapa_iglesias.get(b_semilla.iglesia_nombre) ?? null
        : null;
      if (!iglesia_asignada) {
        iglesia_asignada = mapa_iglesias.get('Iglesia Central El Alto') ?? null;
      }

      // d) Crear o sincronizar perfil de becario con todos los campos reales
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
        const nuevo_becario = this.becario_repo.create({
          ...datos_perfil,
          usuario: usuario_becario,
        });
        becario_guardado = await this.becario_repo.save(nuevo_becario);
      } else {
        Object.assign(becario_existente, datos_perfil);
        becario_guardado = await this.becario_repo.save(becario_existente);
      }

      // f) Formalización de Horarios de Apoyo con Foreign Key íntegra becario_id
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

      // g) Formalización de Asignación de Práctica con Foreign Key íntegra becario_id
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

      // e) Registrar también al becario en evaluadores para autoevaluación académica
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
    this.logger.log(`Nómina oficial sembrada con éxito: ${BECARIOS_SEMILLA.length} becarios registrados.`);

    // 7. Catálogo de los 5 Módulos de Evaluación Canónicos
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

    // 8. Periodos de Evaluación Base
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

    // 9. Tarifas Oficiales de Transporte Urbano
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
        this.logger.log('Tarifas oficiales de transporte registradas en la base de datos.');
      }
    }

    // 10. Paradas oficiales de transporte de La Paz y El Alto
    if (this.parada_repo) {
      for (const p of PARADAS_OFICIALES_DEFECTO) {
        const existe_parada = await this.parada_repo.findOne({ where: { nombre: p.nombre } });
        if (!existe_parada) {
          await this.parada_repo.save(this.parada_repo.create(p));
        }
      }
    }

    // 11. Evento semilla programado institucional
    if (this.evento_repo) {
      const titulo_evento_semilla = 'Encuentro de Liderazgo y Acción Diaconal';
      let evento_semilla = await this.evento_repo.findOne({
        where: { titulo: titulo_evento_semilla },
      });

      const admin_principal =
        mapa_administradores.get('daniel234.davalos@gmail.com') ||
        Array.from(mapa_administradores.values())[0];
      if (!evento_semilla) {
        evento_semilla = this.evento_repo.create({
          creador_id: admin_principal ? admin_principal.id : undefined,
          titulo: titulo_evento_semilla,
          descripcion:
            'Jornada intensiva de formación en liderazgo cristiano, servicio social diaconal e integración formativa de becarios.',
          tipo_evento: TipoEvento.ESCUELA_LIDERES_ESPECIAL,
          fecha: new Date('2026-10-25'),
          hora_inicio: '08:30',
          hora_fin: '13:30',
          latitud: -16.500054,
          longitud: -68.173455,
          radio_tolerancia_m: 100,
          direccion_referencia:
            'Oficina Central Diaconía IFD, Av. Juan Pablo II esq. Calle Sbtte. Jorge Eulert 125, El Alto',
          estado: EstadoEvento.PROGRAMADO,
        });
        await this.evento_repo.save(evento_semilla);
        this.logger.log(`Evento semilla programado creado: "${titulo_evento_semilla}".`);
      }
    }

    // 12. Cuestionario de Bienestar Universitario (26 preguntas canónicas)
    if (this.pregunta_bienestar_repo) {
      const cuenta_preguntas = await this.pregunta_bienestar_repo.count();
      if (cuenta_preguntas === 0) {
        for (const p of PREGUNTAS_BIENESTAR_DEFECTO) {
          await this.pregunta_bienestar_repo.save(this.pregunta_bienestar_repo.create(p));
        }
        this.logger.log('Cuestionario de Bienestar Universitario (26 preguntas) sembrado con éxito.');
      }
    }

    this.logger.log(
      `Verificación y siembra institucional completada con éxito: ${mapa_administradores.size} administradores, ${mapa_supervisores.size} supervisores, ${BECARIOS_SEMILLA.length} estudiantes/becarios y ${mapa_iglesias.size} iglesias.`,
    );
  }
}

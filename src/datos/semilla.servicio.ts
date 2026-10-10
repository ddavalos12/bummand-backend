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
import { hashearContrasena } from '../utilidades/hash.utilidad';

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
    @InjectRepository(TarifaTransporte)
    private readonly tarifa_repo?: Repository<TarifaTransporte>,
    @Optional()
    @InjectRepository(ParadaTransporte)
    private readonly parada_repo?: Repository<ParadaTransporte>,
    @Optional()
    @InjectRepository(Evento)
    private readonly evento_repo?: Repository<Evento>,
  ) {}

  async onModuleInit() {
    try {
      await this.ejecutarSemilla();
    } catch (error: any) {
      this.logger.warn(`No se pudo ejecutar la semilla automática (la BD puede estar apagada): ${error.message}`);
    }
  }

  async ejecutarSemilla() {
    this.logger.log('Iniciando verificación y siembra de datos institucionales de BUMAND...');

    // 1. Administrador General
    const correo_admin = process.env.ADMIN_EMAIL || 'admin@wscrt.com';
    const clave_admin = process.env.ADMIN_CONTRASENA || 'admin';
    let admin_existente = await this.usuario_repo.findOne({ where: { correo: correo_admin } });
    if (!admin_existente) {
      admin_existente = this.usuario_repo.create({
        nombre: 'Administrador General BUMAND',
        correo: correo_admin,
        contrasena_hash: await hashearContrasena(clave_admin),
        rol: Rol.ADMINISTRADOR,
        estado: EstadoUsuario.ACTIVO,
      });
      admin_existente = await this.usuario_repo.save(admin_existente);
      this.logger.log(`Usuario administrador creado: ${correo_admin}`);
    }

    // 2. Supervisor Institucional (Tutor General de Prácticas)
    const correo_supervisor = 'angel.ali@bumand.bo';
    let usuario_supervisor = await this.usuario_repo.findOne({ where: { correo: correo_supervisor } });
    if (!usuario_supervisor) {
      usuario_supervisor = this.usuario_repo.create({
        nombre: 'Angel Javier Ali Paz',
        correo: correo_supervisor,
        contrasena_hash: await hashearContrasena('Bumand2026!'),
        rol: Rol.SUPERVISOR,
        estado: EstadoUsuario.ACTIVO,
      });
      usuario_supervisor = await this.usuario_repo.save(usuario_supervisor);
      this.logger.log(`Usuario supervisor creado: ${correo_supervisor}`);
    }

    // 3. Lugares de práctica institucionales y red de agencias de Diaconía (Rotaciones)
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

    // 4. Iglesias institucionales
    const iglesias_datos = [
      'Iglesia Central El Alto',
      'Iglesia Bautista Emanuel - Sopocachi',
      'Iglesia Metodista El Salvador',
      'Iglesia Presbiteriana Maranata',
    ];
    let iglesia_central: Iglesia | null = null;
    for (const nom_igl of iglesias_datos) {
      let igl = await this.iglesia_repo.findOne({ where: { nombre: nom_igl } });
      if (!igl) {
        igl = await this.iglesia_repo.save(this.iglesia_repo.create({ nombre: nom_igl }));
      }
      if (!iglesia_central) iglesia_central = igl;
    }

    // 5. Evaluadores institucionales
    let evaluador_pastor = await this.evaluador_repo.findOne({
      where: { correo: 'pastor.david@diaconia.bo' },
    });
    if (!evaluador_pastor) {
      evaluador_pastor = this.evaluador_repo.create({
        nombre: 'Pastor David Mamani',
        tipo: TipoEvaluador.PASTOR,
        correo: 'pastor.david@diaconia.bo',
        telefono: '71234567',
      });
      await this.evaluador_repo.save(evaluador_pastor);
    }

    let evaluador_supervisor = await this.evaluador_repo.findOne({
      where: { correo: correo_supervisor },
    });
    if (!evaluador_supervisor) {
      evaluador_supervisor = this.evaluador_repo.create({
        nombre: 'Angel Javier Ali Paz',
        tipo: TipoEvaluador.SUPERVISOR,
        correo: correo_supervisor,
        telefono: '72345678',
      });
      await this.evaluador_repo.save(evaluador_supervisor);
    }

    // 6. Tarifas oficiales de transporte urbano
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

    // 7. Nómina oficial completa de becarios (23 becarios institucionales BUMAND 2026)
    const becarios_datos = [
      { ci: '10028341', nombre: 'Nilda Amalia Churata Paye', correo: 'nilda.churata@bumand.bo', carrera: 'Educación Parvularia', universidad: 'Universidad Mayor de San Andrés', unidad: 'Seguridad Física' },
      { ci: '9160054', nombre: 'Edgar Elias Alarcon Huanca', correo: 'edgar.alarcon@bumand.bo', carrera: 'Medicina', universidad: 'Universidad Mayor de San Andrés', unidad: 'Consultorio Médico' },
      { ci: '13696496', nombre: 'Adai Belen Huayta Cardozo', correo: 'adai.huayta@bumand.bo', carrera: 'Estadística', universidad: 'Universidad Mayor de San Andrés', unidad: 'Productos y Canales' },
      { ci: '8329102', nombre: 'Joel David Condori Mamani', correo: 'joel.condori@bumand.bo', carrera: 'Informática', universidad: 'Universidad Mayor de San Andrés', unidad: 'Sistemas y TI' },
      { ci: '9940123', nombre: 'Ruth Noemi Quispe Flores', correo: 'ruth.quispe@bumand.bo', carrera: 'Contaduría Pública', universidad: 'Universidad Mayor de San Andrés', unidad: 'Finanzas' },
      { ci: '9214556', nombre: 'Samuel Israel Choque Calle', correo: 'samuel.choque@bumand.bo', carrera: 'Administración de Empresas', universidad: 'Universidad Pública de El Alto', unidad: 'Recursos Humanos' },
      { ci: '10582314', nombre: 'Abigail Esther Mamani Ticona', correo: 'abigail.mamani@bumand.bo', carrera: 'Psicología', universidad: 'Universidad Mayor de San Andrés', unidad: 'Bienestar Social' },
      { ci: '12485901', nombre: 'Caleb Josue Limachi Ramos', correo: 'caleb.limachi@bumand.bo', carrera: 'Derecho', universidad: 'Universidad Mayor de San Andrés', unidad: 'Asesoría Legal' },
      { ci: '11048293', nombre: 'Debora Sarai Apaza Gutierrez', correo: 'debora.apaza@bumand.bo', carrera: 'Trabajo Social', universidad: 'Universidad Mayor de San Andrés', unidad: 'Impacto Social' },
      { ci: '9832104', nombre: 'Mateo Lucas Fernandez Cruz', correo: 'mateo.fernandez@bumand.bo', carrera: 'Ingeniería Comercial', universidad: 'Universidad Pública de El Alto', unidad: 'Marketing y Comunicación' },
      { ci: '10928374', nombre: 'Sara Damaris Tintaya Yujra', correo: 'sara.tintaya@bumand.bo', carrera: 'Ciencias de la Educación', universidad: 'Universidad Mayor de San Andrés', unidad: 'Formación Diaconal' },
      { ci: '8493021', nombre: 'Daniel Esteban Laura Paxi', correo: 'daniel.laura@bumand.bo', carrera: 'Economía', universidad: 'Universidad Mayor de San Andrés', unidad: 'Riesgos y Cartera' },
      { ci: '13849201', nombre: 'Nohemi Andrea Mendoza Luna', correo: 'nohemi.mendoza@bumand.bo', carrera: 'Enfermería', universidad: 'Universidad Pública de El Alto', unidad: 'Salud Ocupacional' },
      { ci: '10472910', nombre: 'Marcos Antonio Quisbert Ali', correo: 'marcos.quisbert@bumand.bo', carrera: 'Lingüística', universidad: 'Universidad Mayor de San Andrés', unidad: 'Traducción y Publicaciones' },
      { ci: '9283741', nombre: 'Miriam Raquel Huanca Tarqui', correo: 'miriam.huanca@bumand.bo', carrera: 'Contaduría Pública', universidad: 'Universidad Pública de El Alto', unidad: 'Auditoría Interna' },
      { ci: '11928340', nombre: 'Benjamin Josias Gomez Poma', correo: 'benjamin.gomez@bumand.bo', carrera: 'Informática', universidad: 'Universidad Pública de El Alto', unidad: 'Redes e Infraestructura' },
      { ci: '10384729', nombre: 'Ester Rebeca Carvajal Nina', correo: 'ester.carvajal@bumand.bo', carrera: 'Auditoría Financiera', universidad: 'Universidad Mayor de San Andrés', unidad: 'Control Financiero' },
      { ci: '9482710', nombre: 'David Ezequiel Tola Quispe', correo: 'david.tola@bumand.bo', carrera: 'Comunicación Social', universidad: 'Universidad Mayor de San Andrés', unidad: 'Prensa Institucional' },
      { ci: '12048592', nombre: 'Keila Elizabeth Solares Vega', correo: 'keila.solares@bumand.bo', carrera: 'Bioquímica', universidad: 'Universidad Mayor de San Andrés', unidad: 'Laboratorio y Salud' },
      { ci: '11827394', nombre: 'Josue Natanael Vargas Coarite', correo: 'josue.vargas@bumand.bo', carrera: 'Ingeniería de Sistemas', universidad: 'Universidad Pública de El Alto', unidad: 'Desarrollo de Software' },
      { ci: '10837492', nombre: 'Jemima Priscila Cachi Ramos', correo: 'jemima.cachi@bumand.bo', carrera: 'Odontología', universidad: 'Universidad Mayor de San Andrés', unidad: 'Brigadas Odontológicas' },
      { ci: '9384729', nombre: 'Lucas Gabriel Tintaya Colque', correo: 'lucas.tintaya@bumand.bo', carrera: 'Arquitectura', universidad: 'Universidad Mayor de San Andrés', unidad: 'Proyectos de Infraestructura' },
      { ci: '12938471', nombre: 'Salome Berenice Silva Mamani', correo: 'salome.silva@bumand.bo', carrera: 'Sociología', universidad: 'Universidad Mayor de San Andrés', unidad: 'Investigación Social' },
    ];

    const clave_becario_defecto = 'Bumand2026!';

    for (const b of becarios_datos) {
      let usuario_becario = await this.usuario_repo.findOne({ where: { correo: b.correo } });
      if (!usuario_becario) {
        usuario_becario = this.usuario_repo.create({
          nombre: b.nombre,
          correo: b.correo,
          contrasena_hash: await hashearContrasena(clave_becario_defecto),
          rol: Rol.BECARIO,
          estado: EstadoUsuario.ACTIVO,
        });
        usuario_becario = await this.usuario_repo.save(usuario_becario);
      }

      const becario_existente = await this.becario_repo.findOne({ where: { usuario_id: usuario_becario.id } });
      if (!becario_existente) {
        const nuevo_becario = this.becario_repo.create({
          usuario_id: usuario_becario.id,
          ci: b.ci,
          carrera: b.carrera,
          universidad: b.universidad,
          institucion: 'Diaconía FRIF-IFD',
          unidad: b.unidad,
          fecha_ingreso: new Date('2026-01-15'),
          lugar_practica_id: lugar_central ? lugar_central.id : null,
          iglesia_id: iglesia_central ? iglesia_central.id : null,
          supervisor_id: usuario_supervisor.id,
          usuario: usuario_becario,
        });
        await this.becario_repo.save(nuevo_becario);
      }
    }
    this.logger.log(`Nómina de becarios procesada: ${becarios_datos.length} becarios registrados.`);

    // 8. Catálogo de 5 Módulos de Evaluación
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

    // 9. Periodos de Evaluación Base
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

    // 10. Paradas oficiales de transporte de La Paz y El Alto
    if (this.parada_repo) {
      for (const p of PARADAS_OFICIALES_DEFECTO) {
        const existe_parada = await this.parada_repo.findOne({ where: { nombre: p.nombre } });
        if (!existe_parada) {
          await this.parada_repo.save(this.parada_repo.create(p));
        }
      }
      this.logger.log(`Paradas oficiales de transporte verificadas: ${PARADAS_OFICIALES_DEFECTO.length} registradas.`);
    }

    // 11. Evento semilla programado institucional
    if (this.evento_repo) {
      const titulo_evento_semilla = 'Encuentro de Liderazgo y Acción Diaconal';
      let evento_semilla = await this.evento_repo.findOne({
        where: { titulo: titulo_evento_semilla },
      });

      if (!evento_semilla) {
        evento_semilla = this.evento_repo.create({
          creador_id: admin_existente ? admin_existente.id : undefined,
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

    this.logger.log('Verificación y siembra de datos completada exitosamente.');
  }
}

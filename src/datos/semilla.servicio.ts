import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario, Rol, EstadoUsuario } from '../modulos/usuarios/entidades/usuario.entidad';
import { Becario } from '../modulos/becarios/entidades/becario.entidad';
import { LugarPractica } from '../modulos/lugares-practica/entidades/lugar-practica.entidad';
import { Iglesia } from '../modulos/iglesias/entidades/iglesia.entidad';
import { ModuloEvaluacion } from '../modulos/evaluaciones/entidades/modulo-evaluacion.entidad';
import { PeriodoEvaluacion, EstadoPeriodo } from '../modulos/evaluaciones/entidades/periodo-evaluacion.entidad';
import { Evaluador, TipoEvaluador } from '../modulos/evaluaciones/entidades/evaluador.entidad';
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

    // 3. Lugar de práctica institucional central
    let lugar_central = await this.lugar_repo.findOne({
      where: { nombre: 'Oficina Central Diaconía IFD - El Alto' },
    });
    if (!lugar_central) {
      lugar_central = this.lugar_repo.create({
        nombre: 'Oficina Central Diaconía IFD - El Alto',
        direccion: 'Av. Juan Pablo II esq. Calle Sbtte. Jorge Eulert 125, El Alto',
        latitud: -16.505000,
        longitud: -68.163000,
        radio_tolerancia_m: 50,
      });
      lugar_central = await this.lugar_repo.save(lugar_central);
      this.logger.log('Lugar de práctica central de Diaconía creado.');
    }

    // 4. Iglesia institucional inicial
    let iglesia_central = await this.iglesia_repo.findOne({
      where: { nombre: 'Iglesia Central El Alto' },
    });
    if (!iglesia_central) {
      iglesia_central = this.iglesia_repo.create({
        nombre: 'Iglesia Central El Alto',
      });
      iglesia_central = await this.iglesia_repo.save(iglesia_central);
      this.logger.log('Iglesia institucional creada: Iglesia Central El Alto');
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
      this.logger.log('Evaluador pastoral creado: Pastor David Mamani');
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
      this.logger.log('Evaluador supervisor creado: Angel Javier Ali Paz');
    }

    // 6. Becarios Institucionales Oficiales
    const becarios_datos = [
      {
        ci: '10028341',
        nombre: 'Nilda Amalia Churata Paye',
        correo: 'nilda.churata@bumand.bo',
        carrera: 'Educación Parvularia',
        universidad: 'Universidad Mayor de San Andrés',
        unidad: 'Seguridad Física',
      },
      {
        ci: '9160054',
        nombre: 'Edgar Elias Alarcon Huanca',
        correo: 'edgar.alarcon@bumand.bo',
        carrera: 'Medicina',
        universidad: 'Universidad Mayor de San Andrés',
        unidad: 'Consultorio Médico',
      },
      {
        ci: '13696496',
        nombre: 'Adai Belen Huayta Cardozo',
        correo: 'adai.huayta@bumand.bo',
        carrera: 'Estadística',
        universidad: 'Universidad Mayor de San Andrés',
        unidad: 'Productos y Canales',
      },
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
        this.logger.log(`Usuario creado para becario: ${b.nombre} (${b.correo})`);
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
          lugar_practica_id: lugar_central.id,
          iglesia_id: iglesia_central.id,
          supervisor_id: usuario_supervisor.id,
          usuario: usuario_becario,
        });
        await this.becario_repo.save(nuevo_becario);
        this.logger.log(`Perfil de becario creado para: ${b.nombre}`);
      }
    }

    // 7. Catálogo de 5 Módulos de Evaluación
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

    this.logger.log('Verificación y siembra de datos completada exitosamente.');
  }
}

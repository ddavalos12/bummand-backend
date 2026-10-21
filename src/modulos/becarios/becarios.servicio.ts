import { Injectable, ConflictException, NotFoundException, BadRequestException, ForbiddenException, HttpStatus, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Becario } from './entidades/becario.entidad';
import { HorarioApoyo } from './entidades/horario-apoyo.entidad';
import { ConfiguracionInstitucional } from './entidades/configuracion-institucional.entidad';
import { Usuario, Rol, EstadoUsuario } from '../usuarios/entidades/usuario.entidad';
import { CrearBecarioDto } from './dtos/crear-becario.dto';
import { ActualizarBecarioDto } from './dtos/actualizar-becario.dto';
import { Iglesia } from '../iglesias/entidades/iglesia.entidad';
import { LugarPractica } from '../lugares-practica/entidades/lugar-practica.entidad';
import { hashearContrasena } from '../../utilidades/hash.utilidad';
import { ExcepcionBumand } from '../../nucleo/errores/excepcion-bumand';
import { CODIGOS_ERROR } from '../../nucleo/errores/codigos-error.constante';

@Injectable()
export class BecariosServicio {
  constructor(
    @InjectRepository(Becario)
    private readonly becarioRepositorio: Repository<Becario>,
    @InjectRepository(Usuario)
    private readonly usuarioRepositorio: Repository<Usuario>,
    @Optional()
    @InjectRepository(HorarioApoyo)
    private readonly horarioRepositorio?: Repository<HorarioApoyo>,
    @Optional()
    @InjectRepository(ConfiguracionInstitucional)
    private readonly configuracionRepositorio?: Repository<ConfiguracionInstitucional>,
  ) {}

  private confirmacion_datos_requerida = false;
  private fecha_ultima_orden_confirmacion: Date | null = null;

  async validarSupervisor(supervisor_id: number): Promise<void> {
    const supervisor = await this.usuarioRepositorio.findOne({ where: { id: supervisor_id } });
    if (!supervisor) {
      throw new BadRequestException('El supervisor indicado no existe');
    }
    if (supervisor.rol !== Rol.SUPERVISOR && supervisor.rol !== Rol.ADMINISTRADOR) {
      throw new BadRequestException('El usuario indicado no es un supervisor ni administrador');
    }
    if (supervisor.estado !== EstadoUsuario.ACTIVO) {
      throw new BadRequestException('El supervisor no está activo');
    }
  }

  async crear(dto: CrearBecarioDto): Promise<Becario> {
    const correoExistente = await this.usuarioRepositorio.findOne({ where: { correo: dto.correo } });
    if (correoExistente) {
      throw new ConflictException('Ya existe un usuario con ese correo');
    }

    if (dto.supervisor_id) {
      await this.validarSupervisor(dto.supervisor_id);
    }

    const nuevoUsuario = this.usuarioRepositorio.create({
      nombre: dto.nombre,
      correo: dto.correo,
      contrasena_hash: await hashearContrasena(dto.contrasena),
      rol: Rol.BECARIO,
      estado: EstadoUsuario.ACTIVO,
    });

    const usuarioGuardado = await this.usuarioRepositorio.save(nuevoUsuario);

    const nuevoBecario = this.becarioRepositorio.create({
      nombre: dto.nombre,
      ci: dto.ci || null,
      carrera: dto.carrera,
      universidad: dto.universidad,
      institucion: dto.institucion || null,
      unidad: dto.unidad || null,
      horario_semanal: dto.horario_semanal || null,
      fecha_ingreso: new Date(dto.fecha_ingreso),
      iglesia: dto.iglesia_id ? ({ id: dto.iglesia_id } as Iglesia) : null,
      lugar_practica: dto.lugar_practica_id ? ({ id: dto.lugar_practica_id } as LugarPractica) : null,
      supervisor: dto.supervisor_id ? ({ id: dto.supervisor_id } as Usuario) : null,
      usuario: usuarioGuardado,
    });

    return this.becarioRepositorio.save(nuevoBecario);
  }

  async listar(usuario: Usuario): Promise<Becario[]> {
    const query = this.becarioRepositorio.createQueryBuilder('becario')
      .leftJoinAndSelect('becario.usuario', 'usuario')
      .leftJoinAndSelect('becario.supervisor', 'supervisor')
      .leftJoinAndSelect('becario.lugar_practica', 'lugar_practica')
      .leftJoinAndSelect('becario.iglesia', 'iglesia')
      .orderBy('becario.id', 'ASC');

    if (usuario.rol === Rol.SUPERVISOR) {
      query.where('becario.supervisor_id = :id', { id: usuario.id });
    }

    return query.getMany();
  }

  async obtener(id: number, usuario: Usuario): Promise<Becario> {
    const becario = await this.becarioRepositorio.findOne({
      where: { id },
      relations: { usuario: true, supervisor: true, lugar_practica: true, iglesia: true },
    });

    if (!becario) throw new NotFoundException('Becario no encontrado');

    if (usuario.rol === Rol.SUPERVISOR && becario.supervisor?.id !== usuario.id) {
      throw new NotFoundException('Becario no encontrado'); // No revelar si existe
    }

    return becario;
  }

  async obtenerPorUsuario(usuario_id: number): Promise<Becario | null> {
    return this.becarioRepositorio.findOne({
      where: { usuario: { id: usuario_id } },
      relations: { usuario: true, supervisor: true, lugar_practica: true, iglesia: true },
    });
  }

  async asignarSupervisor(id: number, supervisor_id: number): Promise<Becario> {
    await this.validarSupervisor(supervisor_id);
    const becario = await this.becarioRepositorio.findOne({
      where: { id },
      relations: { usuario: true, supervisor: true, lugar_practica: true, iglesia: true },
    });
    if (!becario) throw new NotFoundException('Becario no encontrado');

    becario.supervisor = { id: supervisor_id } as Usuario;
    becario.supervisor_id = supervisor_id;
    return this.becarioRepositorio.save(becario);
  }

  async actualizar(
    id: number,
    dto: ActualizarBecarioDto,
    rol_solicitante?: Rol,
    usuario_id_solicitante?: number,
  ): Promise<Becario> {
    const becario = await this.becarioRepositorio.findOne({ where: { id }, relations: { usuario: true } });
    if (!becario) throw new NotFoundException('Becario no encontrado');

    if (rol_solicitante === Rol.BECARIO) {
      if (usuario_id_solicitante && becario.usuario_id !== usuario_id_solicitante) {
        throw new ForbiddenException('No tiene permisos para modificar este perfil de becario');
      }

      const dto_record = dto as Record<string, unknown>;
      const campos_protegidos = [
        'universidad',
        'carrera',
        'iglesia_id',
        'lugar_practica_id',
        'supervisor_id',
      ];

      const intenta_modificar_protegido = campos_protegidos.some(
        (campo) => dto_record[campo] !== undefined && dto_record[campo] !== null,
      );

      if (intenta_modificar_protegido) {
        throw new ExcepcionBumand(
          CODIGOS_ERROR.ERR_AUTORIZACION_0001,
          'No está autorizado para modificar campos protegidos de becario: universidad, carrera, iglesia_id, lugar_practica_id, supervisor_id',
          HttpStatus.FORBIDDEN,
        );
      }
    }

    if (dto.supervisor_id) {
      await this.validarSupervisor(dto.supervisor_id);
    }

    // Actualizar usuario si hay nombre
    if (dto.nombre && becario.usuario) {
      becario.usuario.nombre = dto.nombre;
      await this.usuarioRepositorio.save(becario.usuario);
    }

    // Actualizar becario
    if (dto.carrera !== undefined) becario.carrera = dto.carrera;
    if (dto.universidad !== undefined) becario.universidad = dto.universidad;
    if (dto.institucion !== undefined) becario.institucion = dto.institucion || null;
    if (dto.unidad !== undefined) becario.unidad = dto.unidad || null;
    if (dto.ci !== undefined) becario.ci = dto.ci || null;
    if (dto.horario_semanal !== undefined) becario.horario_semanal = dto.horario_semanal || null;

    if (dto.iglesia_id !== undefined) {
      becario.iglesia = dto.iglesia_id ? ({ id: dto.iglesia_id } as Iglesia) : null;
      becario.iglesia_id = dto.iglesia_id || null;
    }
    if (dto.lugar_practica_id !== undefined) {
      becario.lugar_practica = dto.lugar_practica_id ? ({ id: dto.lugar_practica_id } as LugarPractica) : null;
      becario.lugar_practica_id = dto.lugar_practica_id || null;
    }
    if (dto.supervisor_id !== undefined) {
      becario.supervisor = dto.supervisor_id ? ({ id: dto.supervisor_id } as Usuario) : null;
      becario.supervisor_id = dto.supervisor_id || null;
    }

    return this.becarioRepositorio.save(becario);
  }

  private async obtenerConfiguracion(): Promise<ConfiguracionInstitucional | null> {
    if (!this.configuracionRepositorio) return null;
    try {
      let config = await this.configuracionRepositorio.findOne({ where: { id: 1 } });
      if (!config) {
        config = this.configuracionRepositorio.create({
          id: 1,
          confirmacion_datos_activa: false,
          fecha_ultima_orden_confirmacion: null,
          emitida_por_usuario_id: null,
        });
        config = await this.configuracionRepositorio.save(config);
      }
      return config;
    } catch {
      return null;
    }
  }

  async calcularEstadoOrdenGlobal(): Promise<{
    confirmacion_activa: boolean;
    fecha_ultima_solicitud: string | null;
    puede_solicitar: boolean;
    dias_restantes: number;
    segundos_restantes: number;
  }> {
    const COOLDOWN_CONFIRMACION_MS = 7 * 24 * 60 * 60 * 1000;
    const config = await this.obtenerConfiguracion();
    const ahora_ms = Date.now();
    let puede_solicitar = true;
    let dias_restantes = 0;
    let segundos_restantes = 0;
    const fecha_ultima = config?.fecha_ultima_orden_confirmacion ?? this.fecha_ultima_orden_confirmacion;

    if (fecha_ultima) {
      const ultima_ms = new Date(fecha_ultima).getTime();
      const tiempo_transcurrido_ms = ahora_ms - ultima_ms;

      if (tiempo_transcurrido_ms < COOLDOWN_CONFIRMACION_MS) {
        puede_solicitar = false;
        const restante_ms = COOLDOWN_CONFIRMACION_MS - tiempo_transcurrido_ms;
        segundos_restantes = Math.ceil(restante_ms / 1000);
        dias_restantes = Math.ceil(restante_ms / (24 * 60 * 60 * 1000));
      }
    }

    const confirmacion_activa = config
      ? Boolean(config.confirmacion_datos_activa)
      : this.confirmacion_datos_requerida;

    return {
      confirmacion_activa,
      fecha_ultima_solicitud: fecha_ultima ? new Date(fecha_ultima).toISOString() : null,
      puede_solicitar,
      dias_restantes,
      segundos_restantes,
    };
  }

  async ordenConfirmacionDatos(activa: boolean = true, admin_id?: number): Promise<{
    mensaje: string;
    confirmacion_datos_requerida: boolean;
    fecha_ultima_solicitud?: string;
    puede_solicitar?: boolean;
    dias_restantes?: number;
  }> {
    if (activa) {
      const estado = await this.calcularEstadoOrdenGlobal();
      if (!estado.puede_solicitar) {
        throw new BadRequestException(
          `No es posible emitir una nueva orden. Período de enfriamiento institucional activo: restan ${estado.dias_restantes} día(s).`,
        );
      }
    }

    const ahora = new Date();
    this.confirmacion_datos_requerida = activa;
    if (activa) {
      this.fecha_ultima_orden_confirmacion = ahora;
    }

    const config = await this.obtenerConfiguracion();
    if (config) {
      config.confirmacion_datos_activa = activa;
      if (activa) {
        config.fecha_ultima_orden_confirmacion = ahora;
        if (admin_id) config.emitida_por_usuario_id = admin_id;
      }
      try {
        await this.configuracionRepositorio!.save(config);
      } catch {}
    }

    if (activa) {
      await this.becarioRepositorio.update({}, { datos_confirmados: false });
    }

    return {
      mensaje: activa
        ? 'Orden institucional de verificación de datos activada exitosamente.'
        : 'Orden de verificación de datos desactivada.',
      confirmacion_datos_requerida: activa,
      fecha_ultima_solicitud: ahora.toISOString(),
      puede_solicitar: !activa,
      dias_restantes: activa ? 7 : 0,
    };
  }

  async obtenerEstadoConfirmacionDatos(usuario_id: number): Promise<{
    confirmacion_datos_requerida: boolean;
    datos_confirmados: boolean;
    datos_validados: boolean;
    debe_confirmar: boolean;
    fecha_ultima_solicitud: string | null;
  }> {
    const config = await this.obtenerConfiguracion();
    const becario = await this.becarioRepositorio.findOne({ where: { usuario_id } });
    const datos_confirmados = becario ? Boolean(becario.datos_confirmados) : false;
    const datos_validados = becario ? Boolean(becario.datos_validados) : false;
    const confirmacion_datos_requerida = config
      ? Boolean(config.confirmacion_datos_activa)
      : this.confirmacion_datos_requerida;
    const fecha_ultima = config?.fecha_ultima_orden_confirmacion ?? this.fecha_ultima_orden_confirmacion;

    return {
      confirmacion_datos_requerida,
      datos_confirmados,
      datos_validados,
      debe_confirmar: confirmacion_datos_requerida && !datos_confirmados,
      fecha_ultima_solicitud: fecha_ultima ? new Date(fecha_ultima).toISOString() : null,
    };
  }

  async validarDatos(id: number): Promise<Becario> {
    const becario = await this.becarioRepositorio.findOne({
      where: { id },
      relations: { usuario: true, supervisor: true, lugar_practica: true, iglesia: true },
    });
    if (!becario) throw new NotFoundException('Becario no encontrado');

    becario.datos_validados = true;
    becario.datos_confirmados = true;
    becario.fecha_ultima_confirmacion = new Date();
    return this.becarioRepositorio.save(becario);
  }

  async confirmarDatosPropios(usuario_id: number): Promise<{ mensaje: string; becario: Becario }> {
    const becario = await this.becarioRepositorio.findOne({
      where: { usuario_id },
      relations: { usuario: true },
    });
    if (!becario) throw new NotFoundException('Perfil de becario no encontrado');

    becario.datos_confirmados = true;
    becario.fecha_ultima_confirmacion = new Date();
    const guardado = await this.becarioRepositorio.save(becario);
    return {
      mensaje: 'Confirmación de datos registrada exitosamente',
      becario: guardado,
    };
  }

  async eliminar(id: number): Promise<{ mensaje: string }> {
    const becario = await this.becarioRepositorio.findOne({ where: { id }, relations: { usuario: true } });
    if (!becario) throw new NotFoundException('Becario no encontrado');

    if (becario.usuario) {
      becario.usuario.estado = EstadoUsuario.INACTIVO;
      await this.usuarioRepositorio.save(becario.usuario);
    }

    return { mensaje: 'Becario desactivado correctamente' };
  }

  async obtenerHorarios(becario_id: number): Promise<HorarioApoyo[]> {
    if (!this.horarioRepositorio) return [];
    return this.horarioRepositorio.find({
      where: { becario_id },
      order: { dia_semana: 'ASC' },
    });
  }

  async guardarHorarios(
    becario_id: number,
    datos: {
      lugar_practica_id?: number;
      dias: Array<{
        dia_semana: number;
        hora_inicio: string;
        hora_fin: string;
        horas_diarias?: number;
        turno?: string;
        activo?: boolean;
      }>;
    },
  ): Promise<HorarioApoyo[]> {
    const becario = await this.becarioRepositorio.findOne({ where: { id: becario_id } });
    if (!becario) {
      throw new NotFoundException(`Becario con ID ${becario_id} no encontrado`);
    }

    if (datos.lugar_practica_id) {
      becario.lugar_practica_id = datos.lugar_practica_id;
      await this.becarioRepositorio.save(becario);
    }

    if (!this.horarioRepositorio) return [];

    await this.horarioRepositorio.delete({ becario_id });

    if (!datos.dias || datos.dias.length === 0) {
      return [];
    }

    const nuevos = datos.dias.map((d) =>
      this.horarioRepositorio!.create({
        becario_id,
        dia_semana: d.dia_semana,
        hora_inicio: d.hora_inicio,
        hora_fin: d.hora_fin,
        horas_diarias: d.horas_diarias || 4.0,
        turno: d.turno || 'personalizado',
        activo: d.activo !== undefined ? d.activo : true,
      }),
    );

    return this.horarioRepositorio.save(nuevos);
  }
}


import { Injectable, ConflictException, NotFoundException, BadRequestException, ForbiddenException, HttpStatus, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Becario } from './entidades/becario.entidad';
import { HorarioApoyo } from './entidades/horario-apoyo.entidad';
import { ConfiguracionInstitucional } from './entidades/configuracion-institucional.entidad';
import { Usuario, Rol, EstadoUsuario } from '../usuarios/entidades/usuario.entidad';
import { CrearBecarioDto } from './dtos/crear-becario.dto';
import { ActualizarBecarioDto } from './dtos/actualizar-becario.dto';
import { ActualizarConfiguracionPasajesDto } from './dtos/actualizar-configuracion-pasajes.dto';
import { Iglesia } from '../iglesias/entidades/iglesia.entidad';
import { LugarPractica } from '../lugares-practica/entidades/lugar-practica.entidad';
import { hashearContrasena } from '../../utilidades/hash.utilidad';
import {
  esRolMentor,
  obtenerBecariosDesignadosMentor,
  obtenerIdsBecariosDesignadosMentor,
} from '../../utilidades/filtro-mentor.utilidad';
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
    const ci_limpio = dto.ci?.trim();
    if (!ci_limpio) {
      throw new BadRequestException('El número de carnet de identidad (C.I.) es obligatorio');
    }

    const becarioExistente = await this.becarioRepositorio.findOne({
      where: { ci: ci_limpio },
    });
    if (becarioExistente) {
      throw new ConflictException(`Ya existe un becario registrado con el C.I. ${ci_limpio}`);
    }

    if (dto.supervisor_id) {
      await this.validarSupervisor(dto.supervisor_id);
    }

    let usuarioGuardado: Usuario | null = null;
    if (dto.correo && dto.contrasena) {
      const correo_limpio = dto.correo.trim().toLowerCase();
      const correoExistente = await this.usuarioRepositorio.findOne({ where: { correo: correo_limpio } });
      if (correoExistente) {
        throw new ConflictException('Ya existe un usuario con ese correo');
      }

      const nuevoUsuario = this.usuarioRepositorio.create({
        nombre: dto.nombre,
        correo: correo_limpio,
        contrasena_hash: await hashearContrasena(dto.contrasena),
        rol: Rol.BECARIO,
        estado: EstadoUsuario.ACTIVO,
        correo_confirmado: true,
      });

      usuarioGuardado = await this.usuarioRepositorio.save(nuevoUsuario);
    }

    const fecha_ingreso_final = dto.fecha_ingreso ? new Date(dto.fecha_ingreso) : new Date();

    const nuevoBecario = this.becarioRepositorio.create({
      nombre: dto.nombre,
      ci: ci_limpio,
      lugar_expedicion: dto.lugar_expedicion || null,
      celular: dto.celular || null,
      estado_civil: dto.estado_civil || null,
      sexo: dto.sexo || null,
      fecha_nacimiento: dto.fecha_nacimiento || null,
      direccion: dto.direccion || null,
      ciudad: dto.ciudad || null,
      ceti: dto.ceti || null,
      carrera: dto.carrera,
      universidad: dto.universidad,
      institucion: dto.institucion || null,
      unidad: dto.unidad || null,
      horario_semanal: dto.horario_semanal || null,
      fecha_ingreso: fecha_ingreso_final,
      iglesia: dto.iglesia_id ? ({ id: dto.iglesia_id } as Iglesia) : null,
      lugar_practica: dto.lugar_practica_id ? ({ id: dto.lugar_practica_id } as LugarPractica) : null,
      supervisor: dto.supervisor_id ? ({ id: dto.supervisor_id } as Usuario) : null,
      usuario: usuarioGuardado,
      usuario_id: usuarioGuardado ? usuarioGuardado.id : null,
      url_carnet: dto.url_carnet || null,
      url_kardex: dto.url_kardex || null,
    });

    return this.becarioRepositorio.save(nuevoBecario);
  }

  async listar(usuario: Usuario): Promise<Becario[]> {
    const query = this.becarioRepositorio.createQueryBuilder('becario')
      .leftJoinAndSelect('becario.usuario', 'usuario')
      .leftJoinAndSelect('becario.supervisor', 'supervisor')
      .leftJoinAndSelect('becario.lugar_practica', 'lugar_practica')
      .leftJoinAndSelect('becario.iglesia', 'iglesia')
      .leftJoinAndSelect('becario.horarios_apoyo', 'horarios_apoyo')
      .orderBy('becario.id', 'ASC');

    if (esRolMentor(usuario?.rol)) {
      query.where('becario.supervisor_id = :id', { id: usuario.id });
    }

    const lista = await query.getMany();

    let resultado = lista;
    if (
      esRolMentor(usuario?.rol) &&
      (lista.length === 0 || lista.length >= 15) &&
      typeof this.becarioRepositorio.find === 'function'
    ) {
      const designados = await obtenerBecariosDesignadosMentor(
        this.becarioRepositorio,
        usuario,
        usuario.id,
        this.usuarioRepositorio,
      );
      if (designados.length > 0) {
        resultado = designados;
      }
    }

    if (resultado.length > 0 && this.becarioRepositorio.manager) {
      try {
        const ahora = new Date();
        const inicio_mes = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-01`;
        const fin_mes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0).toISOString().split('T')[0];
        const filas_horas: Array<{ becario_id: number; total_horas: string | number }> =
          await this.becarioRepositorio.manager.query(
            `SELECT becario_id, COALESCE(SUM(horas_trabajadas), 0) AS total_horas
             FROM registros_asistencia
             WHERE fecha >= $1 AND fecha <= $2
             GROUP BY becario_id`,
            [inicio_mes, fin_mes],
          );
        const mapa_horas = new Map<number, number>();
        for (const f of filas_horas) {
          mapa_horas.set(Number(f.becario_id), Number(Number(f.total_horas || 0).toFixed(2)));
        }
        for (const b of resultado) {
          (b as Becario & { horas_mes_actual?: number }).horas_mes_actual = mapa_horas.get(b.id) ?? 0;
        }
      } catch {
        for (const b of resultado) {
          (b as Becario & { horas_mes_actual?: number }).horas_mes_actual = 0;
        }
      }
    }

    return resultado;
  }

  async listarDirectorioNombres(): Promise<Array<{ id: number; nombre: string }>> {
    const lista = await this.becarioRepositorio
      .createQueryBuilder('becario')
      .leftJoinAndSelect('becario.usuario', 'usuario')
      .orderBy('becario.nombre', 'ASC')
      .getMany();

    return lista
      .map((b) => ({
        id: b.id,
        nombre: (b.nombre || b.usuario?.nombre || '').trim(),
      }))
      .filter((b) => b.nombre.length > 0);
  }

  async obtener(id: number, usuario: Usuario): Promise<Becario> {
    const becario = await this.becarioRepositorio.findOne({
      where: { id },
      relations: { usuario: true, supervisor: true, lugar_practica: true, iglesia: true },
    });

    if (!becario) throw new NotFoundException('Becario no encontrado');

    if (esRolMentor(usuario?.rol)) {
      const sup_id = becario.supervisor?.id ?? becario.supervisor_id;
      if (sup_id !== usuario.id) {
        const ids_mentor = await obtenerIdsBecariosDesignadosMentor(
          this.becarioRepositorio,
          usuario,
          usuario.id,
          this.usuarioRepositorio,
        );
        if (!ids_mentor.has(becario.id)) {
          throw new NotFoundException('Becario no encontrado'); // No revelar si existe
        }
      }
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
    if (dto.nombre !== undefined) becario.nombre = dto.nombre;
    if (dto.carrera !== undefined) becario.carrera = dto.carrera;
    if (dto.universidad !== undefined) becario.universidad = dto.universidad;
    if (dto.institucion !== undefined) becario.institucion = dto.institucion || null;
    if (dto.unidad !== undefined) becario.unidad = dto.unidad || null;
    if (dto.ci !== undefined) becario.ci = dto.ci || null;
    if (dto.lugar_expedicion !== undefined) becario.lugar_expedicion = dto.lugar_expedicion || null;
    if (dto.celular !== undefined) becario.celular = dto.celular || null;
    if (dto.estado_civil !== undefined) becario.estado_civil = dto.estado_civil || null;
    if (dto.sexo !== undefined) becario.sexo = dto.sexo || null;
    if (dto.fecha_nacimiento !== undefined) becario.fecha_nacimiento = dto.fecha_nacimiento || null;
    if (dto.direccion !== undefined) becario.direccion = dto.direccion || null;
    if (dto.ciudad !== undefined) becario.ciudad = dto.ciudad || null;
    if (dto.ceti !== undefined) becario.ceti = dto.ceti || null;
    if (dto.horario_semanal !== undefined) becario.horario_semanal = dto.horario_semanal || null;
    if (dto.url_carnet !== undefined) becario.url_carnet = dto.url_carnet || null;
    if (dto.url_kardex !== undefined) becario.url_kardex = dto.url_kardex || null;

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
    const config = await this.obtenerConfiguracion();
    const fecha_ultima = config?.fecha_ultima_orden_confirmacion ?? this.fecha_ultima_orden_confirmacion;
    const confirmacion_activa = config
      ? Boolean(config.confirmacion_datos_activa)
      : this.confirmacion_datos_requerida;

    return {
      confirmacion_activa,
      fecha_ultima_solicitud: fecha_ultima ? new Date(fecha_ultima).toISOString() : null,
      puede_solicitar: true,
      dias_restantes: 0,
      segundos_restantes: 0,
    };
  }

  async ordenConfirmacionDatos(activa: boolean = true, admin_id?: number): Promise<{
    mensaje: string;
    confirmacion_datos_requerida: boolean;
    fecha_ultima_solicitud?: string;
    puede_solicitar?: boolean;
    dias_restantes?: number;
  }> {
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
      if (typeof this.becarioRepositorio.createQueryBuilder === 'function') {
        await this.becarioRepositorio
          .createQueryBuilder()
          .update(Becario)
          .set({
            datos_confirmados: false,
            fecha_ultima_confirmacion: null,
            ultimo_mes_datos_confirmados: null,
          })
          .execute();
      } else {
        await this.becarioRepositorio.update(
          {},
          {
            datos_confirmados: false,
            fecha_ultima_confirmacion: null,
            ultimo_mes_datos_confirmados: null,
          },
        );
      }
    }

    return {
      mensaje: activa
        ? 'Orden institucional de verificación de datos activada exitosamente.'
        : 'Orden de verificación de datos desactivada.',
      confirmacion_datos_requerida: activa,
      fecha_ultima_solicitud: ahora.toISOString(),
      puede_solicitar: true,
      dias_restantes: 0,
    };
  }

  async obtenerEstadoConfirmacionDatos(usuario_id: number): Promise<{
    confirmacion_datos_requerida: boolean;
    datos_confirmados: boolean;
    datos_validados: boolean;
    debe_confirmar: boolean;
    fecha_ultima_solicitud: string | null;
    mes_actual: string;
  }> {
    const becario = await this.becarioRepositorio.findOne({ where: { usuario_id } });
    const ahora = new Date();
    const mes_actual = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`;

    const confirmado_este_mes = becario?.ultimo_mes_datos_confirmados === mes_actual;
    const datos_confirmados = becario
      ? Boolean(becario.datos_confirmados) && confirmado_este_mes
      : false;
    const datos_validados = becario ? Boolean(becario.datos_validados) : false;
    const debe_confirmar = becario
      ? (!becario.datos_confirmados || !confirmado_este_mes)
      : false;
    const fecha_ultima = becario?.fecha_ultima_confirmacion;

    return {
      confirmacion_datos_requerida: true,
      datos_confirmados,
      datos_validados,
      debe_confirmar,
      fecha_ultima_solicitud: fecha_ultima ? new Date(fecha_ultima).toISOString() : null,
      mes_actual,
    };
  }

  async validarDatos(id: number): Promise<Becario> {
    const becario = await this.becarioRepositorio.findOne({
      where: { id },
      relations: { usuario: true, supervisor: true, lugar_practica: true, iglesia: true },
    });
    if (!becario) throw new NotFoundException('Becario no encontrado');

    const ahora = new Date();
    const mes_actual = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`;

    becario.datos_validados = true;
    becario.datos_confirmados = true;
    becario.ultimo_mes_datos_confirmados = mes_actual;
    becario.fecha_ultima_confirmacion = ahora;
    return this.becarioRepositorio.save(becario);
  }

  async confirmarDatosPropios(usuario_id: number): Promise<{ mensaje: string; becario: Becario }> {
    const becario = await this.becarioRepositorio.findOne({
      where: { usuario_id },
      relations: { usuario: true },
    });
    if (!becario) throw new NotFoundException('Perfil de becario no encontrado');

    const ahora = new Date();
    const mes_actual = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`;

    becario.datos_confirmados = true;
    becario.ultimo_mes_datos_confirmados = mes_actual;
    becario.fecha_ultima_confirmacion = ahora;
    const guardado = await this.becarioRepositorio.save(becario);
    return {
      mensaje: `Confirmación de datos registrada exitosamente para el ciclo ${mes_actual}`,
      becario: guardado,
    };
  }

  async actualizarConfiguracionPasajes(
    id: number,
    dto: ActualizarConfiguracionPasajesDto,
  ): Promise<Becario> {
    let becario = await this.becarioRepositorio.findOne({
      where: [{ id }, { usuario_id: id }],
    });

    if (!becario && dto.usuario_id) {
      becario = await this.becarioRepositorio.findOne({
        where: { usuario_id: dto.usuario_id },
      });
    }

    if (!becario && dto.ci) {
      const ci_limpio = dto.ci.trim();
      const ci_sin_exp = ci_limpio.split(/[- ]/)[0].trim();
      becario = await this.becarioRepositorio
        .createQueryBuilder('b')
        .where('b.ci = :ci_limpio', { ci_limpio })
        .orWhere('b.ci ILIKE :ci_exp', { ci_exp: `${ci_sin_exp}%` })
        .getOne();

      if (!becario) {
        const todos_becarios = await this.becarioRepositorio.find({ relations: { usuario: true } });
        becario =
          todos_becarios.find((b) => {
            if (!b.ci) return false;
            const b_ci = b.ci.trim().toLowerCase();
            const b_ci_sin_exp = b_ci.split(/[- ]/)[0].trim();
            return b_ci === ci_limpio.toLowerCase() || b_ci_sin_exp === ci_sin_exp.toLowerCase();
          }) || null;
      }
    }

    if (!becario && dto.nombre) {
      const nombre_limpio = dto.nombre.trim();
      becario = await this.becarioRepositorio
        .createQueryBuilder('b')
        .leftJoinAndSelect('b.usuario', 'usuario')
        .where('b.nombre ILIKE :nom', { nom: `%${nombre_limpio}%` })
        .orWhere('usuario.nombre ILIKE :nom', { nom: `%${nombre_limpio}%` })
        .getOne();

      if (!becario) {
        const normalizar = (txt?: string | null) =>
          txt ? txt.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim() : '';
        const nombre_buscado = normalizar(dto.nombre);
        const todos_becarios = await this.becarioRepositorio.find({ relations: { usuario: true } });
        becario =
          todos_becarios.find((b) => {
            const b_nom = normalizar(b.nombre);
            const u_nom = normalizar(b.usuario?.nombre);
            return (
              (b_nom && (b_nom.includes(nombre_buscado) || nombre_buscado.includes(b_nom))) ||
              (u_nom && (u_nom.includes(nombre_buscado) || nombre_buscado.includes(u_nom)))
            );
          }) || null;
      }
    }

    if (!becario) {
      let ci_final = dto.ci?.trim();
      if (ci_final) {
        const existente_por_ci = await this.becarioRepositorio.findOne({ where: { ci: ci_final } });
        if (existente_por_ci) {
          becario = existente_por_ci;
        }
      }

      if (!becario) {
        if (!ci_final) {
          ci_final = `GEN-${id}-${Date.now().toString().slice(-4)}`;
        }
        becario = this.becarioRepositorio.create({
          nombre: dto.nombre || `Becario #${id}`,
          ci: ci_final,
          carrera: 'General',
          universidad: 'Universidad Mayor de San Andrés',
          fecha_ingreso: new Date(),
          usuario_id: dto.usuario_id || null,
          modalidad_pasajes: dto.modalidad_pasajes || 'ida_y_vuelta',
          configuracion_pasajes_actividades: dto.configuracion_pasajes_actividades || null,
        });
        becario = await this.becarioRepositorio.save(becario);
        return becario;
      }
    }

    if (dto.modalidad_pasajes !== undefined) {
      becario.modalidad_pasajes = dto.modalidad_pasajes;
    }
    if (dto.configuracion_pasajes_actividades !== undefined) {
      becario.configuracion_pasajes_actividades = dto.configuracion_pasajes_actividades;
    }
    becario = await this.becarioRepositorio.save(becario);

    return becario;
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
    }

    const claves_dias: Record<number, string> = {
      0: 'domingo',
      1: 'lunes',
      2: 'martes',
      3: 'miercoles',
      4: 'jueves',
      5: 'viernes',
      6: 'sabado',
    };
    const nuevo_horario_json: Record<string, string> = {};
    for (const d of datos.dias || []) {
      const clave = claves_dias[d.dia_semana];
      if (clave && d.activo !== false && d.hora_inicio && d.hora_fin) {
        nuevo_horario_json[clave] = `${d.hora_inicio} - ${d.hora_fin}`;
      }
    }
    becario.horario_semanal = nuevo_horario_json;
    await this.becarioRepositorio.save(becario);

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


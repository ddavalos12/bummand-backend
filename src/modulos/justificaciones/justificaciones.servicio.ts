import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Justificacion, EstadoJustificacion, TipoIncidencia } from './entidades/justificacion.entidad';
import { Becario } from '../becarios/entidades/becario.entidad';
import { AsistenciaEvento, EstadoAsistenciaEvento } from '../eventos/entidades/asistencia-evento.entidad';
import { Multa } from '../asistencia/entidades/multa.entidad';
import {
  RegistroAsistencia,
  TipoAsistencia,
  EstadoAprobacionAsistencia,
} from '../asistencia/entidades/registro-asistencia.entidad';
import { CrearJustificacionDto } from './dtos/crear-justificacion.dto';
import { ResolverJustificacionDto } from './dtos/resolver-justificacion.dto';
import {
  RevisarSupervisorJustificacionDto,
  AprobarAdminJustificacionDto,
} from './dtos/revisar-justificacion.dto';
import { Rol } from '../usuarios/entidades/usuario.entidad';
import { TiempoRealGateway } from '../tiempo-real/tiempo-real.gateway';
import { NotificacionesServicio } from '../notificaciones/notificaciones.servicio';

@Injectable()
export class JustificacionesServicio {
  constructor(
    @InjectRepository(Justificacion)
    private readonly justificacion_repo: Repository<Justificacion>,
    @InjectRepository(Becario)
    private readonly becario_repo: Repository<Becario>,
    @Optional()
    @InjectRepository(AsistenciaEvento)
    private readonly asistencia_evento_repo?: Repository<AsistenciaEvento>,
    @Optional()
    @InjectRepository(Multa)
    private readonly multaRepositorio?: Repository<Multa>,
    @Optional()
    @InjectRepository(RegistroAsistencia)
    private readonly asistenciaRepositorio?: Repository<RegistroAsistencia>,
    @Optional()
    private readonly tiempoRealGateway?: TiempoRealGateway,
    @Optional()
    private readonly notificaciones_servicio?: NotificacionesServicio,
  ) {}

  async crear(
    dto: CrearJustificacionDto,
    usuario_id?: number,
    usuario_rol?: Rol,
  ): Promise<Justificacion> {
    let becario: Becario | null = null;

    if (dto.becario_id) {
      becario = await this.becario_repo.findOne({
        where: { usuario_id: dto.becario_id },
      });
      if (!becario) {
        becario = await this.becario_repo.findOne({
          where: { id: dto.becario_id },
        });
      }
    } else if (usuario_id) {
      becario = await this.becario_repo.findOne({
        where: { usuario_id },
      });
      if (!becario) {
        becario = await this.becario_repo.findOne({
          where: { id: usuario_id },
        });
      }
    }

    if (
      !becario &&
      (usuario_id || dto.becario_id) &&
      typeof this.becario_repo.create === 'function' &&
      typeof this.becario_repo.save === 'function'
    ) {
      const ref_id = usuario_id || dto.becario_id || 1;
      try {
        const nuevo = this.becario_repo.create({
          usuario_id: usuario_id ?? null,
          nombre: `Becario #${ref_id}`,
          carrera: 'General',
          universidad: 'Universidad Mayor de San Andrés',
          fecha_ingreso: new Date(),
          modalidad_pasajes: 'ida_y_vuelta',
        });
        becario = await this.becario_repo.save(nuevo);
      } catch {
        const primero = await this.becario_repo.findOne({ where: {} });
        if (primero) becario = primero;
      }
    }

    if (!becario) {
      throw new NotFoundException('Perfil de becario no encontrado para registrar la justificación');
    }

    const es_admin = usuario_rol === Rol.ADMINISTRADOR;

    const nueva_justificacion = this.justificacion_repo.create({
      becario_id: becario.id,
      tipo_incidencia: dto.tipo_incidencia,
      referencia_id: dto.referencia_id || null,
      fecha_incidencia: new Date(dto.fecha_incidencia),
      motivo: dto.motivo,
      descripcion: dto.descripcion,
      archivo_prueba_url: dto.archivo_prueba_url || null,
      nombre_archivo_prueba: dto.nombre_archivo_prueba || null,
      estado: es_admin ? EstadoJustificacion.APROBADA : EstadoJustificacion.PENDIENTE,
      aprobado_por_admin_id: es_admin ? usuario_id : null,
      fecha_aprobacion_admin: es_admin ? new Date() : null,
      fecha_resolucion: es_admin ? new Date() : null,
      observacion_admin: es_admin
        ? dto.descripcion || 'Permiso creado y aprobado directamente por Administración'
        : null,
    });

    const guardada = await this.justificacion_repo.save(nueva_justificacion);

    if (es_admin) {
      await this.anularMultasDeViernesSiAplica(guardada);
      await this.compensarAsistenciaPorPermiso(guardada);
    }

    this.tiempoRealGateway?.notificarJustificacion({ accion: 'crear', justificacion: guardada });
    return guardada;
  }

  async obtenerTodas(): Promise<Justificacion[]> {
    return this.justificacion_repo.find({
      relations: { becario: { usuario: true, lugar_practica: true }, supervisor: true },
      order: { created_at: 'DESC' },
    });
  }

  async obtenerPorId(id: number): Promise<Justificacion> {
    const justificacion = await this.justificacion_repo.findOne({
      where: { id },
      relations: { becario: { usuario: true, lugar_practica: true }, supervisor: true },
    });

    if (!justificacion) {
      throw new NotFoundException(`Justificación con ID ${id} no encontrada`);
    }

    return justificacion;
  }

  async obtenerPorBecario(identificador: number): Promise<Justificacion[]> {
    let becario_id = identificador;
    if (this.becario_repo) {
      let becario = await this.becario_repo.findOne({
        where: { usuario_id: identificador },
      });
      if (!becario) {
        becario = await this.becario_repo.findOne({
          where: { id: identificador },
        });
      }
      if (becario) {
        becario_id = becario.id;
      }
    }

    return this.justificacion_repo.find({
      where: { becario_id },
      relations: { becario: { usuario: true, lugar_practica: true }, supervisor: true },
      order: { created_at: 'DESC' },
    });
  }

  async resolver(
    id: number,
    dto: ResolverJustificacionDto,
    usuario_id: number,
  ): Promise<Justificacion> {
    const justificacion = await this.obtenerPorId(id);

    const estados_validos = Object.values(EstadoJustificacion);
    if (!estados_validos.includes(dto.estado)) {
      throw new BadRequestException('El estado de resolución es inválido');
    }

    const obs_sup = dto.observacion_supervisor?.trim();
    const obs_adm = dto.observacion_admin?.trim();
    const obs_gen = dto.observacion?.trim();
    const obs_rechazo = dto.motivo_rechazo?.trim();
    const obs_final = obs_adm || obs_sup || obs_gen || obs_rechazo;

    if (!obs_final && dto.estado === EstadoJustificacion.RECHAZADA) {
      throw new BadRequestException('El motivo u observación de rechazo no puede estar vacío');
    }

    const es_aprobacion =
      dto.estado === EstadoJustificacion.APROBADA ||
      dto.estado === EstadoJustificacion.APROBADO_ADMINISTRACION;

    justificacion.estado = es_aprobacion ? EstadoJustificacion.APROBADA : dto.estado;
    justificacion.supervisor_id = usuario_id;
    justificacion.fecha_resolucion = new Date();

    if (obs_sup) {
      justificacion.observacion_supervisor = obs_sup;
    }
    if (obs_adm || obs_gen) {
      justificacion.observacion_admin = obs_adm || obs_gen || null;
    }

    if (es_aprobacion) {
      justificacion.aprobado_por_admin_id = usuario_id;
      justificacion.fecha_aprobacion_admin = new Date();
      if (!justificacion.observacion_admin && obs_final) {
        justificacion.observacion_admin = obs_final;
      }

      await this.anularMultasDeViernesSiAplica(justificacion);
      await this.compensarAsistenciaPorPermiso(justificacion);

      if (
        justificacion.tipo_incidencia === TipoIncidencia.ASISTENCIA_EVENTO &&
        justificacion.referencia_id &&
        this.asistencia_evento_repo
      ) {
        try {
          const asistencia = await this.asistencia_evento_repo.findOne({
            where: { id: justificacion.referencia_id },
          });
          if (asistencia) {
            asistencia.estado = EstadoAsistenciaEvento.JUSTIFICADO;
            asistencia.observaciones = asistencia.observaciones
              ? `${asistencia.observaciones} | Justificación #${justificacion.id} aprobada`
              : `Justificación #${justificacion.id} aprobada`;
            await this.asistencia_evento_repo.save(asistencia);
          }
        } catch {}
      }
    }

    const guardada = await this.justificacion_repo.save(justificacion);
    await this.notificarResolucionPermiso(
      guardada,
      es_aprobacion ? 'Permiso Aprobado' : 'Permiso Rechazado',
      obs_final || (es_aprobacion ? 'Tu permiso fue aprobado y compensado al 100%.' : 'Tu solicitud de permiso fue rechazada.'),
    );
    this.tiempoRealGateway?.notificarJustificacion({ accion: 'resolver', justificacion: guardada });
    return guardada;
  }

  async revisarSupervisor(
    id: number,
    dto: RevisarSupervisorJustificacionDto,
    supervisor_id: number,
  ): Promise<Justificacion> {
    const justificacion = await this.obtenerPorId(id);
    const estado = dto.estado || EstadoJustificacion.REVISADO_SUPERVISOR;

    justificacion.estado = estado;
    justificacion.supervisor_id = supervisor_id;
    justificacion.revisado_por_supervisor_id = supervisor_id;
    justificacion.fecha_revision_supervisor = new Date();
    if (dto.observacion_supervisor) {
      justificacion.observacion_supervisor = dto.observacion_supervisor;
    }

    const guardada = await this.justificacion_repo.save(justificacion);
    const es_rechazo =
      estado === EstadoJustificacion.RECHAZADA || estado === EstadoJustificacion.OBSERVADA;
    await this.notificarResolucionPermiso(
      guardada,
      es_rechazo ? 'Permiso Rechazado / Observado por Mentor' : 'Permiso Revisado por Mentor',
      dto.observacion_supervisor ||
        (es_rechazo
          ? 'El Mentor observó o rechazó tu solicitud de permiso.'
          : 'El Mentor dio su visto bueno a tu permiso y lo remitió a Administración.'),
    );
    this.tiempoRealGateway?.notificarJustificacion({
      accion: 'revisar_supervisor',
      justificacion: guardada,
    });
    return guardada;
  }

  async aprobarAdministracion(
    id: number,
    dto: AprobarAdminJustificacionDto,
    admin_id: number,
  ): Promise<Justificacion> {
    const justificacion = await this.obtenerPorId(id);
    const estado = dto.estado || EstadoJustificacion.APROBADO_ADMINISTRACION;

    justificacion.estado = estado;
    justificacion.aprobado_por_admin_id = admin_id;
    justificacion.fecha_aprobacion_admin = new Date();
    justificacion.fecha_resolucion = new Date();
    if (dto.observacion_admin) {
      justificacion.observacion_admin = dto.observacion_admin;
    }

    const es_aprobada =
      estado === EstadoJustificacion.APROBADO_ADMINISTRACION ||
      estado === EstadoJustificacion.APROBADA;

    if (es_aprobada) {
      await this.anularMultasDeViernesSiAplica(justificacion);
      await this.compensarAsistenciaPorPermiso(justificacion);

      if (
        justificacion.tipo_incidencia === TipoIncidencia.ASISTENCIA_EVENTO &&
        justificacion.referencia_id &&
        this.asistencia_evento_repo
      ) {
        try {
          const asistencia = await this.asistencia_evento_repo.findOne({
            where: { id: justificacion.referencia_id },
          });
          if (asistencia) {
            asistencia.estado = EstadoAsistenciaEvento.JUSTIFICADO;
            asistencia.observaciones = asistencia.observaciones
              ? `${asistencia.observaciones} | Permiso #${justificacion.id} aprobado por administración`
              : `Permiso #${justificacion.id} aprobado por administración`;
            await this.asistencia_evento_repo.save(asistencia);
          }
        } catch {}
      }
    }

    const guardada = await this.justificacion_repo.save(justificacion);
    await this.notificarResolucionPermiso(
      guardada,
      es_aprobada ? 'Permiso Aprobado' : 'Permiso Rechazado',
      dto.observacion_admin ||
        justificacion.observacion_supervisor ||
        (es_aprobada
          ? 'Permiso aprobado definitivamente por Administración (asistencia compensada al 100%).'
          : 'Permiso rechazado por Administración.'),
    );
    this.tiempoRealGateway?.notificarJustificacion({
      accion: 'aprobar_administracion',
      justificacion: guardada,
    });
    return guardada;
  }

  private async compensarAsistenciaPorPermiso(justificacion: Justificacion): Promise<void> {
    if (
      !this.asistenciaRepositorio ||
      typeof this.asistenciaRepositorio.find !== 'function' ||
      !justificacion.becario_id ||
      !justificacion.fecha_incidencia
    ) {
      return;
    }

    try {
      const fecha_falta_str =
        justificacion.fecha_incidencia instanceof Date
          ? justificacion.fecha_incidencia.toISOString().split('T')[0]
          : String(justificacion.fecha_incidencia).split('T')[0];

      const registros = await this.asistenciaRepositorio.find({
        where: { becario_id: justificacion.becario_id },
      });

      const existente = (registros || []).find((r) => {
        if (
          justificacion.referencia_id &&
          justificacion.tipo_incidencia !== TipoIncidencia.ASISTENCIA_EVENTO &&
          r.id === justificacion.referencia_id
        ) {
          return true;
        }
        if (!r.fecha) return false;
        const r_str =
          r.fecha instanceof Date
            ? r.fecha.toISOString().split('T')[0]
            : String(r.fecha).split('T')[0];
        return r_str === fecha_falta_str;
      });

      if (existente && typeof this.asistenciaRepositorio.save === 'function') {
        existente.dentro_de_horario = true;
        existente.dentro_de_radio = true;
        existente.minutos_retraso = 0;
        existente.validado = true;
        existente.confirmado_organizador = true;
        if (Number(existente.horas_computadas || existente.horas_trabajadas || 0) === 0) {
          existente.horas_computadas = 4.0;
          existente.horas_trabajadas = 4.0;
        }
        existente.observacion_supervisor =
          existente.observacion_supervisor || 'Compensado al 100% por permiso aprobado';
        existente.estado_aprobacion = EstadoAprobacionAsistencia.APROBADO_ADMINISTRACION;
        await this.asistenciaRepositorio.save(existente);
      } else if (
        typeof this.asistenciaRepositorio.create === 'function' &&
        typeof this.asistenciaRepositorio.save === 'function'
      ) {
        const [anio, mes, dia] = fecha_falta_str.split('-').map(Number);
        const fecha_obj = new Date(anio, (mes || 1) - 1, dia || 1);
        const tipo_asistencia =
          justificacion.tipo_incidencia === TipoIncidencia.ESCUELA_LIDERES
            ? TipoAsistencia.ESCUELA_LIDERES
            : TipoAsistencia.PRACTICAS;

        const nuevo_registro = this.asistenciaRepositorio.create({
          becario_id: justificacion.becario_id,
          tipo: tipo_asistencia,
          fecha: fecha_obj,
          hora_ingreso: tipo_asistencia === TipoAsistencia.ESCUELA_LIDERES ? '14:30:00' : '08:00:00',
          hora_salida: tipo_asistencia === TipoAsistencia.ESCUELA_LIDERES ? '17:30:00' : '12:00:00',
          hora_prevista: tipo_asistencia === TipoAsistencia.ESCUELA_LIDERES ? '14:30' : '08:00',
          dentro_de_horario: true,
          dentro_de_radio: true,
          minutos_retraso: 0,
          confirmado_organizador: true,
          es_registro_manual: true,
          horas_trabajadas: 4.0,
          motivo_contingencia: `Permiso aprobado: ${justificacion.motivo || 'Justificación institucional'}`,
          observacion_supervisor: 'Compensado al 100% por permiso aprobado',
          estado_aprobacion: EstadoAprobacionAsistencia.APROBADO_ADMINISTRACION,
        });
        nuevo_registro.validado = true;
        nuevo_registro.horas_computadas = 4.0;
        await this.asistenciaRepositorio.save(nuevo_registro);
      }
    } catch {}
  }

  private async notificarResolucionPermiso(
    justificacion: Justificacion,
    titulo: string,
    detalle_observacion: string,
  ): Promise<void> {
    if (!this.notificaciones_servicio) return;

    try {
      let usuario_id = justificacion.becario?.usuario_id || null;
      if (!usuario_id && this.becario_repo && typeof this.becario_repo.findOne === 'function') {
        const becario = await this.becario_repo.findOne({
          where: { id: justificacion.becario_id },
        });
        usuario_id = becario?.usuario_id || becario?.id || null;
      }
      if (!usuario_id) {
        usuario_id = justificacion.becario_id;
      }

      const fecha_str =
        justificacion.fecha_incidencia instanceof Date
          ? justificacion.fecha_incidencia.toISOString().split('T')[0]
          : String(justificacion.fecha_incidencia || '').split('T')[0];

      const mensaje = `Fecha: ${fecha_str} (${justificacion.motivo || 'Permiso'}). Dictamen de Mentor/Administración: ${detalle_observacion}`;
      await this.notificaciones_servicio.crear(usuario_id, titulo, mensaje, 'justificacion');
    } catch {}
  }

  private async anularMultasDeViernesSiAplica(justificacion: Justificacion): Promise<void> {
    if (!this.multaRepositorio || !justificacion.becario_id || !justificacion.fecha_incidencia) {
      return;
    }
    try {
      const multas = await this.multaRepositorio.find({
        where: { becario_id: justificacion.becario_id },
      });
      const fecha_incidencia_str =
        justificacion.fecha_incidencia instanceof Date
          ? justificacion.fecha_incidencia.toISOString().split('T')[0]
          : String(justificacion.fecha_incidencia).split('T')[0];

      for (const multa of multas) {
        const fecha_multa_str =
          multa.fecha_aplicacion instanceof Date
            ? multa.fecha_aplicacion.toISOString().split('T')[0]
            : String(multa.fecha_aplicacion).split('T')[0];

        if (fecha_multa_str === fecha_incidencia_str) {
          multa.monto_bs = 0;
          multa.motivo = 'Multa eximida/anulada por Permiso aprobado por Administración';
          await this.multaRepositorio.save(multa);
        }
      }
    } catch {}
  }
}

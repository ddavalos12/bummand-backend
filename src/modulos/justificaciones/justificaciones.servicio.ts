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
import { RegistroAsistencia } from '../asistencia/entidades/registro-asistencia.entidad';
import { CrearJustificacionDto } from './dtos/crear-justificacion.dto';
import { ResolverJustificacionDto } from './dtos/resolver-justificacion.dto';
import {
  RevisarSupervisorJustificacionDto,
  AprobarAdminJustificacionDto,
} from './dtos/revisar-justificacion.dto';
import { Rol } from '../usuarios/entidades/usuario.entidad';
import { TiempoRealGateway } from '../tiempo-real/tiempo-real.gateway';

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
    }

    this.tiempoRealGateway?.notificarJustificacion({ accion: 'crear', justificacion: guardada });
    return guardada;
  }

  async obtenerTodas(): Promise<Justificacion[]> {
    return this.justificacion_repo.find({
      relations: ['becario', 'becario.usuario', 'becario.lugar_practica', 'supervisor'] as any,
      order: { created_at: 'DESC' },
    });
  }

  async obtenerPorId(id: number): Promise<Justificacion> {
    const justificacion = await this.justificacion_repo.findOne({
      where: { id },
      relations: ['becario', 'becario.usuario', 'becario.lugar_practica', 'supervisor'] as any,
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
      relations: ['becario', 'becario.usuario', 'becario.lugar_practica', 'supervisor'] as any,
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

      // Si la justificación es aprobada y está vinculada a un evento, actualizar el estado de la asistencia
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
        } catch {
          // Tolerancia si la referencia no corresponde a asistencia
        }
      }
    }

    const guardada = await this.justificacion_repo.save(justificacion);
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

    if (
      estado === EstadoJustificacion.APROBADO_ADMINISTRACION ||
      estado === EstadoJustificacion.APROBADA
    ) {
      await this.anularMultasDeViernesSiAplica(justificacion);

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
        } catch {
          // Tolerancia si no coincide id
        }
      }
    }

    const guardada = await this.justificacion_repo.save(justificacion);
    this.tiempoRealGateway?.notificarJustificacion({
      accion: 'aprobar_administracion',
      justificacion: guardada,
    });
    return guardada;
  }

  private async anularMultasDeViernesSiAplica(justificacion: Justificacion): Promise<void> {
    if (!this.multaRepositorio || !justificacion.becario_id || !justificacion.fecha_incidencia) {
      return;
    }
    try {
      const multas = await this.multaRepositorio.find({
        where: { becario_id: justificacion.becario_id },
      });
      const fechaIncidenciaStr =
        justificacion.fecha_incidencia instanceof Date
          ? justificacion.fecha_incidencia.toISOString().split('T')[0]
          : String(justificacion.fecha_incidencia).split('T')[0];

      for (const multa of multas) {
        const fechaMultaStr =
          multa.fecha_aplicacion instanceof Date
            ? multa.fecha_aplicacion.toISOString().split('T')[0]
            : String(multa.fecha_aplicacion).split('T')[0];

        if (fechaMultaStr === fechaIncidenciaStr) {
          multa.monto_bs = 0;
          multa.motivo = 'Multa eximida/anulada por Permiso aprobado por Administración';
          await this.multaRepositorio.save(multa);
        }
      }
    } catch {
      // Silencioso ante fallos en tabla multas
    }
  }
}

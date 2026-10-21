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
import { CrearJustificacionDto } from './dtos/crear-justificacion.dto';
import { ResolverJustificacionDto } from './dtos/resolver-justificacion.dto';
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
    private readonly tiempoRealGateway?: TiempoRealGateway,
  ) {}

  async crear(dto: CrearJustificacionDto, usuario_id?: number): Promise<Justificacion> {
    let becario: Becario | null = null;

    if (dto.becario_id) {
      becario = await this.becario_repo.findOne({
        where: [{ id: dto.becario_id }, { usuario_id: dto.becario_id }],
      });
    } else if (usuario_id) {
      becario = await this.becario_repo.findOne({
        where: { usuario_id },
      });
    }

    if (!becario) {
      throw new NotFoundException('Perfil de becario no encontrado para registrar la justificación');
    }

    const nueva_justificacion = this.justificacion_repo.create({
      becario_id: becario.id,
      tipo_incidencia: dto.tipo_incidencia,
      referencia_id: dto.referencia_id || null,
      fecha_incidencia: new Date(dto.fecha_incidencia),
      motivo: dto.motivo,
      descripcion: dto.descripcion,
      archivo_prueba_url: dto.archivo_prueba_url || null,
      nombre_archivo_prueba: dto.nombre_archivo_prueba || null,
      estado: EstadoJustificacion.PENDIENTE,
    });

    const guardada = await this.justificacion_repo.save(nueva_justificacion);
    this.tiempoRealGateway?.notificarJustificacion({ accion: 'crear', justificacion: guardada });
    return guardada;
  }

  async obtenerTodas(): Promise<Justificacion[]> {
    return this.justificacion_repo.find({
      relations: {
        becario: { usuario: true },
        supervisor: true,
      },
      order: { created_at: 'DESC' },
    });
  }

  async obtenerPorId(id: number): Promise<Justificacion> {
    const justificacion = await this.justificacion_repo.findOne({
      where: { id },
      relations: {
        becario: { usuario: true },
        supervisor: true,
      },
    });

    if (!justificacion) {
      throw new NotFoundException(`Justificación con ID ${id} no encontrada`);
    }

    return justificacion;
  }

  async obtenerPorBecario(becario_id: number): Promise<Justificacion[]> {
    return this.justificacion_repo.find({
      where: { becario_id },
      relations: {
        supervisor: true,
      },
      order: { created_at: 'DESC' },
    });
  }

  async resolver(
    id: number,
    dto: ResolverJustificacionDto,
    supervisor_id: number,
  ): Promise<Justificacion> {
    const justificacion = await this.obtenerPorId(id);

    if (
      dto.estado !== EstadoJustificacion.APROBADA &&
      dto.estado !== EstadoJustificacion.RECHAZADA
    ) {
      throw new BadRequestException('El estado de resolución debe ser aprobada o rechazada');
    }

    if (!dto.observacion_supervisor || dto.observacion_supervisor.trim().length === 0) {
      throw new BadRequestException('La fundamentación escrita del supervisor es obligatoria');
    }

    justificacion.estado = dto.estado;
    justificacion.supervisor_id = supervisor_id;
    justificacion.observacion_supervisor = dto.observacion_supervisor;
    justificacion.fecha_resolucion = new Date();

    const guardada = await this.justificacion_repo.save(justificacion);

    // Si la justificación es aprobada y está vinculada a un evento, actualizar el estado de la asistencia
    if (
      dto.estado === EstadoJustificacion.APROBADA &&
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
        // En caso de que la referencia no sea id de asistencia sino de evento
      }
    }

    this.tiempoRealGateway?.notificarJustificacion({ accion: 'resolver', justificacion: guardada });

    return guardada;
  }
}

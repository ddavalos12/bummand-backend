import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Devocional } from './entidades/devocional.entidad';
import { CitaSeguimiento, EstadoCita, ModalidadCita } from './entidades/cita-seguimiento.entidad';
import { Becario } from '../becarios/entidades/becario.entidad';
import { Rol } from '../usuarios/entidades/usuario.entidad';
import { NotificacionesServicio } from '../notificaciones/notificaciones.servicio';
import { TiempoRealGateway } from '../tiempo-real/tiempo-real.gateway';
import { CrearDevocionalDto } from './dtos/crear-devocional.dto';
import { RetroalimentarDevocionalDto } from './dtos/retroalimentar-devocional.dto';
import { CrearCitaSeguimientoDto } from './dtos/crear-cita-seguimiento.dto';
import { ActualizarCitaSeguimientoDto } from './dtos/actualizar-cita-seguimiento.dto';

@Injectable()
export class DevocionalesServicio {
  constructor(
    @InjectRepository(Devocional)
    private readonly repositorio_devocional: Repository<Devocional>,
    @InjectRepository(Becario)
    private readonly repositorio_becario: Repository<Becario>,
    @InjectRepository(CitaSeguimiento)
    private readonly repositorio_cita: Repository<CitaSeguimiento>,
    private readonly servicio_notificaciones: NotificacionesServicio,
    @Optional()
    private readonly tiempo_real_gateway?: TiempoRealGateway,
  ) {}

  async crear(dto: CrearDevocionalDto, usuario_id?: number): Promise<Devocional> {
    let becario_id = dto.becario_id;

    if (!becario_id && usuario_id) {
      const becario = await this.repositorio_becario.findOne({
        where: [{ usuario_id }, { id: usuario_id }],
      });
      if (!becario) {
        throw new BadRequestException('Perfil de becario no encontrado para este usuario.');
      }
      becario_id = becario.id;
    }

    if (!becario_id) {
      throw new BadRequestException('El campo becario_id es obligatorio.');
    }

    const nuevo_devocional = this.repositorio_devocional.create({
      becario_id,
      fecha: new Date(dto.fecha),
      cita_biblica: dto.cita_biblica,
      titulo: dto.titulo,
      reflexion: dto.reflexion,
      oracion_peticion: dto.oracion_peticion,
      revisado_por_pastor: false,
    });

    const guardado = await this.repositorio_devocional.save(nuevo_devocional);
    this.tiempo_real_gateway?.notificarDevocional({ accion: 'crear', devocional: guardado });
    return guardado;
  }

  async obtenerTodos(usuario?: { id: number; rol: string }): Promise<Devocional[]> {
    if (usuario?.rol === Rol.BECARIO) {
      const becario = await this.repositorio_becario.findOne({
        where: [{ usuario_id: usuario.id }, { id: usuario.id }],
      });
      if (!becario) {
        return [];
      }
      return this.repositorio_devocional.find({
        where: { becario_id: becario.id },
        relations: { becario: { usuario: true } },
        order: { fecha: 'DESC', created_at: 'DESC' },
      });
    }

    if (usuario?.rol === Rol.SUPERVISOR) {
      const becarios_supervisados = await this.repositorio_becario.find({
        where: { supervisor_id: usuario.id },
      });

      if (becarios_supervisados.length > 0) {
        const ids_becarios = becarios_supervisados.map((b) => b.id);
        return this.repositorio_devocional.find({
          where: { becario_id: In(ids_becarios) },
          relations: { becario: { usuario: true } },
          order: { fecha: 'DESC', created_at: 'DESC' },
        });
      }

      // Si no hay becarios con supervisor_id === usuario.id asignados aún en BD demo, retorna los devocionales existentes para no dejar vacío el entorno demo
      return this.repositorio_devocional.find({
        relations: { becario: { usuario: true } },
        order: { fecha: 'DESC', created_at: 'DESC' },
      });
    }

    return this.repositorio_devocional.find({
      relations: { becario: { usuario: true } },
      order: { fecha: 'DESC', created_at: 'DESC' },
    });
  }

  async obtenerPorBecario(becario_id: number): Promise<Devocional[]> {
    const becario = await this.repositorio_becario.findOne({
      where: [{ id: becario_id }, { usuario_id: becario_id }],
    });
    const id_busqueda = becario ? becario.id : becario_id;

    return this.repositorio_devocional.find({
      where: { becario_id: id_busqueda },
      order: { fecha: 'DESC', created_at: 'DESC' },
    });
  }

  async obtenerPorId(id: number): Promise<Devocional> {
    const devocional = await this.repositorio_devocional.findOne({
      where: { id },
      relations: { becario: { usuario: true } },
    });

    if (!devocional) {
      throw new NotFoundException(`Devocional con ID ${id} no encontrado.`);
    }

    return devocional;
  }

  async retroalimentarPastor(id: number, dto: RetroalimentarDevocionalDto): Promise<Devocional> {
    const devocional = await this.obtenerPorId(id);
    devocional.comentario_pastoral = dto.comentario_pastoral;
    devocional.revisado_por_pastor = true;
    const guardado = await this.repositorio_devocional.save(devocional);
    this.tiempo_real_gateway?.notificarDevocional({ accion: 'retroalimentar', devocional: guardado });
    return guardado;
  }

  async eliminar(id: number): Promise<{ mensaje: string }> {
    const devocional = await this.obtenerPorId(id);
    await this.repositorio_devocional.remove(devocional);
    this.tiempo_real_gateway?.notificarDevocional({ accion: 'eliminar', id });
    return { mensaje: 'Devocional eliminado satisfactoriamente.' };
  }

  // --- Citas de Seguimiento y Supervisión ---

  async obtenerMisSupervisados(supervisor_id: number): Promise<Becario[]> {
    const supervisados = await this.repositorio_becario.find({
      where: { supervisor_id },
      relations: { usuario: true },
    });

    if (supervisados.length > 0) {
      return supervisados;
    }

    // Si la lista está vacía en entorno demo (porque ningún becario tenía supervisor_id poblado aún), retorna los becarios activos para permitir agendar citas sin bloqueo
    return this.repositorio_becario.find({
      relations: { usuario: true },
    });
  }

  async crearCitaSeguimiento(supervisor_id: number, dto: CrearCitaSeguimientoDto): Promise<CitaSeguimiento> {
    const becario = await this.repositorio_becario.findOne({
      where: { id: dto.becario_id },
      relations: { usuario: true },
    });

    if (!becario) {
      throw new NotFoundException('Becario no encontrado.');
    }

    if (
      becario.supervisor_id !== null &&
      becario.supervisor_id !== undefined &&
      becario.supervisor_id !== supervisor_id
    ) {
      throw new BadRequestException('El becario seleccionado no pertenece a su cohorte de supervisión.');
    }

    const nueva_cita = this.repositorio_cita.create({
      supervisor_id,
      becario_id: dto.becario_id,
      fecha_cita: dto.fecha_cita,
      hora_cita: dto.hora_cita,
      modalidad: dto.modalidad || ModalidadCita.PRESENCIAL,
      lugar_o_enlace: dto.lugar_o_enlace,
      motivo_retroalimentacion: dto.motivo_retroalimentacion,
      cita_biblica: dto.cita_biblica || null,
      estado: EstadoCita.PROGRAMADA,
    });

    const cita_guardada = await this.repositorio_cita.save(nueva_cita);

    if (becario.usuario_id) {
      try {
        await this.servicio_notificaciones.crear({
          usuario_id: becario.usuario_id,
          tipo: 'cita_seguimiento',
          mensaje: `Tienes una nueva cita de seguimiento agendada para el ${dto.fecha_cita} a las ${dto.hora_cita}. Modalidad: ${dto.modalidad || ModalidadCita.PRESENCIAL}.`,
        });
      } catch {
        // Notificación opcional no bloqueante
      }
    }

    const cita_completa = await this.repositorio_cita.findOne({
      where: { id: cita_guardada.id },
      relations: { becario: { usuario: true }, supervisor: true },
    });

    return cita_completa || cita_guardada;
  }

  async obtenerCitasSeguimiento(usuario: { id: number; rol: string }): Promise<CitaSeguimiento[]> {
    if (usuario.rol === Rol.SUPERVISOR) {
      return this.repositorio_cita.find({
        where: { supervisor_id: usuario.id },
        relations: { becario: { usuario: true }, supervisor: true },
        order: { fecha_cita: 'DESC', created_at: 'DESC' },
      });
    }

    if (usuario.rol === Rol.BECARIO) {
      const becario = await this.repositorio_becario.findOne({
        where: [{ usuario_id: usuario.id }, { id: usuario.id }],
      });
      if (!becario) {
        return [];
      }
      return this.repositorio_cita.find({
        where: { becario_id: becario.id },
        relations: { becario: { usuario: true }, supervisor: true },
        order: { fecha_cita: 'DESC', created_at: 'DESC' },
      });
    }

    return this.repositorio_cita.find({
      relations: { becario: { usuario: true }, supervisor: true },
      order: { fecha_cita: 'DESC', created_at: 'DESC' },
    });
  }

  async actualizarCitaSeguimiento(
    id: number,
    supervisor_id: number,
    dto: ActualizarCitaSeguimientoDto,
  ): Promise<CitaSeguimiento> {
    const cita = await this.repositorio_cita.findOne({
      where: { id },
      relations: { becario: { usuario: true }, supervisor: true },
    });

    if (!cita) {
      throw new NotFoundException('Cita de seguimiento no encontrada.');
    }

    if (cita.supervisor_id !== supervisor_id) {
      throw new ForbiddenException('Solo el supervisor que agendó la cita puede actualizarla.');
    }

    if (dto.estado !== undefined) {
      cita.estado = dto.estado;
    }
    if (dto.acuerdos_retroalimentacion !== undefined) {
      cita.acuerdos_retroalimentacion = dto.acuerdos_retroalimentacion;
    }
    if (dto.fecha_cita !== undefined) {
      cita.fecha_cita = dto.fecha_cita;
    }
    if (dto.hora_cita !== undefined) {
      cita.hora_cita = dto.hora_cita;
    }
    if (dto.modalidad !== undefined) {
      cita.modalidad = dto.modalidad;
    }
    if (dto.lugar_o_enlace !== undefined) {
      cita.lugar_o_enlace = dto.lugar_o_enlace;
    }
    if (dto.motivo_retroalimentacion !== undefined) {
      cita.motivo_retroalimentacion = dto.motivo_retroalimentacion;
    }
    if (dto.cita_biblica !== undefined) {
      cita.cita_biblica = dto.cita_biblica;
    }

    const cita_actualizada = await this.repositorio_cita.save(cita);

    if (cita_actualizada.becario?.usuario_id && (dto.acuerdos_retroalimentacion || dto.estado)) {
      try {
        const detalle_mensaje = dto.acuerdos_retroalimentacion
          ? `Se registraron acuerdos y retroalimentación en tu cita de seguimiento.`
          : `Tu cita de seguimiento ha cambiado de estado a: ${dto.estado}.`;

        await this.servicio_notificaciones.crear({
          usuario_id: cita_actualizada.becario.usuario_id,
          tipo: 'cita_seguimiento',
          mensaje: detalle_mensaje,
        });
      } catch {
        // Notificación opcional no bloqueante
      }
    }

    return cita_actualizada;
  }
}

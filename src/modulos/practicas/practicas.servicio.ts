import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AprobacionPracticas, EstadoAprobacionPracticas } from './entidades/aprobacion-practicas.entidad';
import { CrearAprobacionDto } from './dtos/crear-aprobacion.dto';
import {
  RevisarSupervisorPracticasDto,
  AprobarAdminPracticasDto,
} from './dtos/revisar-aprobacion-practicas.dto';

@Injectable()
export class PracticasServicio {
  constructor(
    @InjectRepository(AprobacionPracticas)
    private readonly aprobacion_repo: Repository<AprobacionPracticas>,
  ) {}

  async crear(dto: CrearAprobacionDto, supervisor_id: number): Promise<AprobacionPracticas> {
    const aprobacion = this.aprobacion_repo.create({
      ...dto,
      firma_digital: dto.firma_digital ?? null,
      supervisor_id: dto.supervisor_id || supervisor_id,
    });
    return this.aprobacion_repo.save(aprobacion);
  }

  async listar(): Promise<AprobacionPracticas[]> {
    return this.aprobacion_repo.find({
      relations: {
        becario: { usuario: true },
        supervisor: true,
      },
      order: { id: 'DESC' },
    });
  }

  async obtenerPorBecario(becario_id: number): Promise<AprobacionPracticas[]> {
    return this.aprobacion_repo.find({
      where: { becario_id },
      relations: { supervisor: true },
      order: { created_at: 'DESC' },
    });
  }

  async obtenerPorId(id: number): Promise<AprobacionPracticas> {
    const aprobacion = await this.aprobacion_repo.findOne({
      where: { id },
      relations: {
        becario: { usuario: true },
        supervisor: true,
      },
    });
    if (!aprobacion) {
      throw new NotFoundException(`Aprobación con ID ${id} no encontrada`);
    }
    return aprobacion;
  }

  async revisarSupervisor(
    id: number,
    dto: RevisarSupervisorPracticasDto,
    supervisor_id: number,
  ): Promise<AprobacionPracticas> {
    const aprobacion = await this.obtenerPorId(id);
    aprobacion.revisado_por_supervisor_id = supervisor_id;
    aprobacion.fecha_revision_supervisor = new Date();
    if (dto.observacion_supervisor) {
      aprobacion.observacion_supervisor = dto.observacion_supervisor;
    }
    aprobacion.estado =
      dto.estado || EstadoAprobacionPracticas.REVISADO_SUPERVISOR;

    return this.aprobacion_repo.save(aprobacion);
  }

  async aprobarAdministracion(
    id: number,
    dto: AprobarAdminPracticasDto,
    admin_id: number,
  ): Promise<AprobacionPracticas> {
    const aprobacion = await this.obtenerPorId(id);
    aprobacion.aprobado_por_admin_id = admin_id;
    aprobacion.fecha_aprobacion_admin = new Date();
    if (dto.observacion_admin) {
      aprobacion.observacion_admin = dto.observacion_admin;
    }
    aprobacion.estado =
      dto.estado || EstadoAprobacionPracticas.APROBADO_ADMINISTRACION;

    return this.aprobacion_repo.save(aprobacion);
  }
}

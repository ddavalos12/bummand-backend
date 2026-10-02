import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AprobacionPracticas } from './entidades/aprobacion-practicas.entidad';
import { CrearAprobacionDto } from './dtos/crear-aprobacion.dto';

@Injectable()
export class PracticasServicio {
  constructor(
    @InjectRepository(AprobacionPracticas)
    private readonly aprobacion_repo: Repository<AprobacionPracticas>,
  ) {}

  async crear(dto: CrearAprobacionDto, supervisor_id: number): Promise<AprobacionPracticas> {
    const aprobacion = this.aprobacion_repo.create({
      ...dto,
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
}
